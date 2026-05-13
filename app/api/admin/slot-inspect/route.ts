import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import { TIME_ZONE, type LocationId, type ServiceLine } from "@/lib/constants";
import { fetchActiveProvidersForService } from "@/lib/providers-db";
import { isHoldBucketId } from "@/lib/slots-luxon";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

type BookingDebug = {
  id: string;
  startIso: string;
  startAtMs: number;
  locationId: string;
  serviceLine: string;
  durationMin: number;
  providerId: string;
  providerDisplayName: string;
  status: string;
  bucketIds: string[];
};

type BucketDebug = {
  id: string;
  bookingId: string | null;
  holdId: string | null;
  providerId: string | null;
  scope: string | null;
  serviceLine: string | null;
  durationMin: number | null;
  startIso: string | null;
  kind: "booking" | "hold";
};

type HoldDebug = {
  id: string;
  locationId: string;
  scope: string;
  startIso: string;
  startAtMs: number;
  endIso: string;
  endAtMs: number;
  durationMin: number;
  note: string;
  createdByEmail: string | null;
};

type ProviderDebug = {
  id: string;
  displayName: string;
  active: boolean;
  schedule: { openHour: number; openMinute: number; closeHour: number; closeMinute: number } | null;
};

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const locationId = searchParams.get("locationId") as LocationId | null;
  const serviceLine = searchParams.get("serviceLine") as ServiceLine | null;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (locationId !== "paris" && locationId !== "sulphur_springs") {
    return NextResponse.json({ error: "Invalid locationId" }, { status: 400 });
  }
  if (serviceLine !== "massage" && serviceLine !== "chiropractic") {
    return NextResponse.json({ error: "Invalid serviceLine" }, { status: 400 });
  }

  const db = getFirestore();

  const dayStart = DateTime.fromISO(date, { zone: TIME_ZONE }).startOf("day");
  const dayEnd = dayStart.plus({ days: 1 });

  const eligible = await fetchActiveProvidersForService(db, locationId, serviceLine);
  const providers: ProviderDebug[] = eligible.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    active: p.active,
    schedule: p.schedule ?? null,
  }));

  const bookingSnap = await db
    .collection("bookings")
    .where("startAt", ">=", Timestamp.fromDate(dayStart.toUTC().toJSDate()))
    .where("startAt", "<", Timestamp.fromDate(dayEnd.toUTC().toJSDate()))
    .get();

  const bookings: BookingDebug[] = [];
  for (const d of bookingSnap.docs) {
    const data = d.data();
    if (data.locationId !== locationId) continue;
    if (data.serviceLine && data.serviceLine !== serviceLine) continue;
    const startAt = data.startAt as Timestamp | undefined;
    bookings.push({
      id: d.id,
      startIso: data.startIso ?? "",
      startAtMs: startAt ? startAt.toMillis() : 0,
      locationId: data.locationId ?? "",
      serviceLine: data.serviceLine ?? "",
      durationMin: data.durationMin ?? 0,
      providerId: data.providerId ?? "",
      providerDisplayName: data.providerDisplayName ?? "",
      status: data.status ?? "",
      bucketIds: Array.isArray(data.bucketIds) ? data.bucketIds : [],
    });
  }
  bookings.sort((a, b) => a.startAtMs - b.startAtMs);

  const allBuckets = await db.collection("slot_buckets").get();
  const datePart = `__${date}__`;
  const buckets: BucketDebug[] = [];
  for (const d of allBuckets.docs) {
    if (!d.id.startsWith(`${locationId}__`)) continue;
    if (!d.id.includes(datePart)) continue;
    const data = d.data();
    const isHold = isHoldBucketId(d.id);
    buckets.push({
      id: d.id,
      bookingId: typeof data.bookingId === "string" ? data.bookingId : null,
      holdId: typeof data.holdId === "string" ? data.holdId : null,
      providerId: typeof data.providerId === "string" ? data.providerId : null,
      scope: typeof data.scope === "string" ? data.scope : null,
      serviceLine: typeof data.serviceLine === "string" ? data.serviceLine : null,
      durationMin: typeof data.durationMin === "number" ? data.durationMin : null,
      startIso: typeof data.startIso === "string" ? data.startIso : null,
      kind: isHold ? "hold" : "booking",
    });
  }
  buckets.sort((a, b) => a.id.localeCompare(b.id));

  const holdSnap = await db
    .collection("slot_holds")
    .where("locationId", "==", locationId)
    .where("startAt", ">=", Timestamp.fromDate(dayStart.toUTC().toJSDate()))
    .where("startAt", "<", Timestamp.fromDate(dayEnd.toUTC().toJSDate()))
    .get();
  const holds: HoldDebug[] = [];
  for (const d of holdSnap.docs) {
    const data = d.data();
    const startAt = data.startAt as Timestamp | undefined;
    const endAt = data.endAt as Timestamp | undefined;
    holds.push({
      id: d.id,
      locationId: data.locationId,
      scope: data.scope,
      startIso: data.startIso,
      startAtMs: startAt ? startAt.toMillis() : 0,
      endIso: data.endIso ?? "",
      endAtMs: endAt ? endAt.toMillis() : 0,
      durationMin: data.durationMin ?? 0,
      note: data.note ?? "",
      createdByEmail: data.createdByEmail ?? null,
    });
  }
  holds.sort((a, b) => a.startAtMs - b.startAtMs);

  return NextResponse.json({
    date,
    locationId,
    serviceLine,
    providers,
    bookings,
    buckets,
    holds,
  });
}
