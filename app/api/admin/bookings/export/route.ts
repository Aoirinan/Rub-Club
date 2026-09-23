import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { buildBookingsExportCsv } from "@/lib/bookings-export-csv";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { isBookingStatus, type BookingStatus } from "@/lib/booking-status";
import { TIME_ZONE } from "@/lib/constants";

export const runtime = "nodejs";

const EXPORT_LIMIT = 5000;

/** JSON body `{ from, to, status, … }` → the same params the GET query string carries. */
async function paramsFromJsonBody(req: Request): Promise<URLSearchParams | null> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return null;
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(json)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params;
}

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  // Search terms (patient names, phones) must not ride in the URL, where they
  // end up in hosting request logs. Searches use POST with the same filters.
  if (searchParams.has("q")) {
    return NextResponse.json(
      { error: "Send the search in a POST body, not the URL." },
      { status: 400 },
    );
  }
  return exportBookings(searchParams);
}

/** Same filters as GET, sent as a JSON body so `q` stays out of the URL. */
export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await paramsFromJsonBody(req);
  if (!params) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  return exportBookings(params);
}

async function exportBookings(searchParams: URLSearchParams) {
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const statusStr = searchParams.get("status");
  const locationId = searchParams.get("locationId");
  const providerId = searchParams.get("providerId");
  const q = searchParams.get("q");

  const fromMs = fromStr ? Date.parse(fromStr) : Date.now() - 90 * 24 * 60 * 60 * 1000;
  const toMs = toStr ? Date.parse(toStr) : Date.now() + 90 * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }
  const from = Timestamp.fromMillis(fromMs);
  const to = Timestamp.fromMillis(toMs);

  const statuses: BookingStatus[] = statusStr
    ? statusStr.split(",").map((s) => s.trim()).filter(isBookingStatus)
    : [];

  const db = getFirestore();
  const snap = await db
    .collection("bookings")
    .where("startAt", ">=", from)
    .where("startAt", "<=", to)
    .orderBy("startAt", "asc")
    .limit(EXPORT_LIMIT)
    .get();

  const csv = buildBookingsExportCsv(snap.docs, {
    statuses,
    locationId: locationId || null,
    providerId: providerId || null,
    q: q || null,
  });
  const filename = `bookings-export-${DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Set when the date range held more rows than the export limit.
      ...(snap.size >= EXPORT_LIMIT ? { "X-Export-Truncated": "1" } : {}),
    },
  });
}
