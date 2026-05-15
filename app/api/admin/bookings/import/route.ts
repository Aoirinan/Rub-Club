import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import type { DurationMin, LocationId, ServiceLine } from "@/lib/constants";
import { TIME_ZONE } from "@/lib/constants";
import { requireStaff } from "@/lib/staff-auth";
import { buildColMap, parseColumnMapJson } from "@/lib/csv-import-columns";
import { parseCsvRows } from "@/lib/csv-parse";
import { isAlignedToSlotGrid, parseStartIsoToDateTime } from "@/lib/slots-luxon";
import { insertAdminBookingInTransaction } from "@/lib/admin-booking-insert";

export const runtime = "nodejs";

const MAX_DATA_ROWS = 500;
const MAX_ERRORS_RETURNED = 80;

function parseLocationId(raw: string): LocationId | null {
  const t = raw.trim().toLowerCase();
  if (t === "paris" || t === "paris, tx") return "paris";
  if (t === "sulphur_springs" || t === "sulphur springs, tx" || t.includes("sulphur") || t.includes("sulfur")) {
    return "sulphur_springs";
  }
  return null;
}

function parseServiceLine(raw: string): ServiceLine | null {
  const t = raw.trim().toLowerCase();
  if (t === "massage") return "massage";
  if (t === "chiropractic" || t === "chiro") return "chiropractic";
  return null;
}

function parseDuration(raw: string): DurationMin | null {
  const n = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
  if (n === 30 || n === 60) return n as DurationMin;
  return null;
}

function parseChicagoStart(dateStr: string, timeStr: string): DateTime | null {
  const d = dateStr.trim();
  const tm = timeStr.trim();
  const patterns = ["yyyy-MM-dd h:mm a", "yyyy-MM-dd hh:mm a", "yyyy-MM-dd H:mm a", "yyyy-MM-dd HH:mm"];
  for (const p of patterns) {
    const dt = DateTime.fromFormat(`${d} ${tm}`, p, { zone: TIME_ZONE });
    if (dt.isValid) return dt;
  }
  return null;
}

type ProviderForImport = {
  id: string;
  displayName: string;
  active: boolean;
  locationIds: LocationId[];
  serviceLines: ServiceLine[];
};

function resolveProvider(
  rows: ProviderForImport[],
  locationId: LocationId,
  serviceLine: ServiceLine,
  providerIdRaw: string,
  providerNameRaw: string,
): { id: string; displayName: string } | { error: string } {
  const eligible = rows.filter(
    (p) =>
      p.active &&
      p.locationIds.includes(locationId) &&
      p.serviceLines.includes(serviceLine),
  );

  const idTrim = providerIdRaw.trim();
  if (idTrim) {
    const hit = eligible.find((p) => p.id === idTrim);
    if (!hit) return { error: `Unknown provider_id "${idTrim}" for this location/service.` };
    return { id: hit.id, displayName: hit.displayName };
  }

  const nameTrim = providerNameRaw.trim();
  if (!nameTrim) return { error: "Provider name is empty." };

  const lower = nameTrim.toLowerCase();
  const matches = eligible.filter((p) => p.displayName.trim().toLowerCase() === lower);
  if (matches.length === 1) return { id: matches[0]!.id, displayName: matches[0]!.displayName };
  if (matches.length > 1) {
    return { error: `Ambiguous provider name "${nameTrim}" — use provider_id instead.` };
  }

  const partial = eligible.filter((p) => p.displayName.trim().toLowerCase().includes(lower));
  if (partial.length === 1) return { id: partial[0]!.id, displayName: partial[0]!.displayName };

  return { error: `No provider match for "${nameTrim}" at this location/service.` };
}

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ct = req.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json(
      { error: 'Send multipart/form-data with a CSV file in the "file" field.' },
      { status: 400 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const skipConflictCheck =
    form.get("skipConflictCheck") === "true" ||
    form.get("skipConflictCheck") === "on" ||
    form.get("skipConflictCheck") === "1";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: 'Missing file field "file".' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Uploaded value is not a file." }, { status: 400 });
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return NextResponse.json({ error: "Could not read file." }, { status: 400 });
  }

  const grid = parseCsvRows(text);
  if (grid.length < 2) {
    return NextResponse.json({ error: "CSV must include a header row and at least one data row." }, { status: 400 });
  }

  const headerRow = grid[0]!;
  const columnMapRaw = form.get("columnMap");
  const parsedOverrides = parseColumnMapJson(columnMapRaw);
  if ("error" in parsedOverrides) {
    return NextResponse.json({ error: parsedOverrides.error }, { status: 400 });
  }
  const hasOverrides = Object.keys(parsedOverrides).length > 0;
  const colMap = buildColMap(headerRow, hasOverrides ? parsedOverrides : undefined);
  if ("error" in colMap) {
    return NextResponse.json({ error: colMap.error }, { status: 400 });
  }

  const dataRows = grid.slice(1).filter((r) => r.some((c) => c.trim().length > 0));
  if (dataRows.length > MAX_DATA_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_DATA_ROWS}). Split into multiple uploads.` },
      { status: 400 },
    );
  }

  const db = getFirestore();
  const provSnap = await db.collection("providers").get();
  const providers: ProviderForImport[] = provSnap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      displayName: typeof data.displayName === "string" ? data.displayName : "",
      active: data.active === true,
      locationIds: Array.isArray(data.locationIds) ? (data.locationIds as LocationId[]) : [],
      serviceLines: Array.isArray(data.serviceLines) ? (data.serviceLines as ServiceLine[]) : [],
    };
  });

  const errors: { row: number; message: string }[] = [];
  const createdIds: string[] = [];
  const skipped: { row: number; reason: string }[] = [];

  const staffActor = { uid: staff.uid, email: staff.email ?? null };

  for (let ri = 0; ri < dataRows.length; ri++) {
    const row = dataRows[ri]!;
    const excelRow = ri + 2;

    const cell = (idx: number) => (idx >= 0 && idx < row.length ? row[idx]! : "").trim();

    const existingId = cell(colMap.bookingId);
    if (/^[A-Za-z0-9]{18,28}$/.test(existingId)) {
      skipped.push({ row: excelRow, reason: "Row has a Booking ID — skipped as likely already in the system." });
      continue;
    }

    const name = cell(colMap.name);
    if (name.length < 2 || name.length > 120) {
      errors.push({ row: excelRow, message: "Patient name must be 2–120 characters." });
      continue;
    }

    const locationId = parseLocationId(cell(colMap.location));
    if (!locationId) {
      errors.push({ row: excelRow, message: `Unknown location "${cell(colMap.location)}".` });
      continue;
    }

    const serviceLine = parseServiceLine(cell(colMap.service));
    if (!serviceLine) {
      errors.push({ row: excelRow, message: `Unknown service "${cell(colMap.service)}".` });
      continue;
    }

    const durationMin = parseDuration(cell(colMap.duration));
    if (!durationMin) {
      errors.push({ row: excelRow, message: `Duration must be 30 or 60 (got "${cell(colMap.duration)}").` });
      continue;
    }

    let start: DateTime | null = null;
    if (colMap.startIso >= 0) {
      const iso = cell(colMap.startIso);
      start = parseStartIsoToDateTime(iso);
    } else {
      start = parseChicagoStart(cell(colMap.date), cell(colMap.time));
    }
    if (!start || !start.isValid) {
      errors.push({ row: excelRow, message: "Invalid date/time or start_iso." });
      continue;
    }
    if (!isAlignedToSlotGrid(start)) {
      errors.push({
        row: excelRow,
        message: "Start time must fall on the 30-minute schedule grid.",
      });
      continue;
    }

    const resolved = resolveProvider(
      providers,
      locationId,
      serviceLine,
      colMap.providerId >= 0 ? cell(colMap.providerId) : "",
      colMap.provider >= 0 ? cell(colMap.provider) : "",
    );
    if ("error" in resolved) {
      errors.push({ row: excelRow, message: resolved.error });
      continue;
    }

    const statusRaw = colMap.status >= 0 ? cell(colMap.status).toLowerCase() : "confirmed";
    const status = statusRaw === "pending" ? "pending" : "confirmed";

    const phone = colMap.phone >= 0 ? cell(colMap.phone) : "";
    if (phone.length > 40) {
      errors.push({ row: excelRow, message: "Phone exceeds 40 characters." });
      continue;
    }

    let email = colMap.email >= 0 ? cell(colMap.email) : "";
    if (email.length > 200) {
      errors.push({ row: excelRow, message: "Email exceeds 200 characters." });
      continue;
    }
    email = email.toLowerCase();

    const notes = colMap.notes >= 0 ? cell(colMap.notes) : "";
    if (notes.length > 1200) {
      errors.push({ row: excelRow, message: "Notes exceed 1200 characters." });
      continue;
    }

    const bookingRef = db.collection("bookings").doc();

    try {
      const ins = await insertAdminBookingInTransaction(db, bookingRef, {
        start,
        locationId,
        serviceLine,
        durationMin,
        providerId: resolved.id,
        providerDisplayName: resolved.displayName,
        name,
        phone,
        email,
        notes,
        status,
        skipConflictCheck,
        staff: staffActor,
        createMetaVia: "csv_import",
      });

      if (ins === "ok") {
        createdIds.push(bookingRef.id);
      } else if (ins === "slot_taken") {
        errors.push({ row: excelRow, message: "Slot already taken (or enable skip conflict in the form)." });
      } else {
        errors.push({
          row: excelRow,
          message: "Time blocked by a hold — remove the hold or enable skip conflict.",
        });
      }
    } catch (e) {
      console.error("[admin/bookings/import]", e);
      errors.push({ row: excelRow, message: "Server error creating this row." });
    }

    if (errors.length >= MAX_ERRORS_RETURNED) {
      errors.push({
        row: excelRow,
        message: `Stopped after ${MAX_ERRORS_RETURNED} errors; fix CSV and try again.`,
      });
      break;
    }
  }

  return NextResponse.json({
    ok: true,
    totalRows: dataRows.length,
    created: createdIds.length,
    bookingIds: createdIds,
    skipped,
    errors,
    skipConflictCheck,
  });
}
