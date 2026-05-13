import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { isBookingStatus, type BookingStatus } from "@/lib/booking-status";

export const runtime = "nodejs";

type StaffActor = {
  uid: string | null;
  email: string | null;
  atIso: string | null;
  reason: string | null;
};

type BookingRowDto = {
  id: string;
  startIso?: string;
  startAtMs?: number;
  locationId?: string;
  serviceLine?: string;
  durationMin?: number;
  providerId?: string;
  providerDisplayName?: string;
  providerMode?: string;
  preferredProviderId?: string;
  preferredProviderDisplayName?: string;
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: BookingStatus;
  accepted?: StaffActor;
  declined?: StaffActor;
  cancelled?: StaffActor;
  createdAtMs?: number;
};

function timestampToMs(value: unknown): number | undefined {
  if (value instanceof Timestamp) return value.toMillis();
  return undefined;
}

function timestampToIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return null;
}

function actor(
  uid: unknown,
  email: unknown,
  at: unknown,
  reason: unknown,
): StaffActor | undefined {
  if (
    uid === undefined &&
    email === undefined &&
    at === undefined &&
    reason === undefined
  ) {
    return undefined;
  }
  return {
    uid: typeof uid === "string" ? uid : null,
    email: typeof email === "string" ? email : null,
    atIso: timestampToIso(at),
    reason: typeof reason === "string" ? reason : null,
  };
}

function matchesQuery(row: BookingRowDto, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [row.name, row.phone, row.email, row.providerDisplayName, row.id]
    .filter((s): s is string => typeof s === "string")
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const statusStr = searchParams.get("status");
  const locationId = searchParams.get("locationId");
  const providerId = searchParams.get("providerId");
  const q = searchParams.get("q") ?? "";

  const from = fromStr
    ? Timestamp.fromMillis(Date.parse(fromStr))
    : Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
  const to = toStr
    ? Timestamp.fromMillis(Date.parse(toStr))
    : Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const statuses: BookingStatus[] = statusStr
    ? statusStr
        .split(",")
        .map((s) => s.trim())
        .filter(isBookingStatus)
    : [];

  const db = getFirestore();
  const snap = await db
    .collection("bookings")
    .where("startAt", ">=", from)
    .where("startAt", "<=", to)
    .orderBy("startAt", "asc")
    .limit(1000)
    .get();

  const rows: BookingRowDto[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    const status = isBookingStatus(data.status) ? data.status : undefined;
    if (statuses.length && (!status || !statuses.includes(status))) continue;
    if (locationId && data.locationId !== locationId) continue;
    if (providerId && data.providerId !== providerId) continue;

    const row: BookingRowDto = {
      id: d.id,
      startIso: typeof data.startIso === "string" ? data.startIso : undefined,
      startAtMs: timestampToMs(data.startAt),
      locationId: typeof data.locationId === "string" ? data.locationId : undefined,
      serviceLine: typeof data.serviceLine === "string" ? data.serviceLine : undefined,
      durationMin: typeof data.durationMin === "number" ? data.durationMin : undefined,
      providerId: typeof data.providerId === "string" ? data.providerId : undefined,
      providerDisplayName:
        typeof data.providerDisplayName === "string" ? data.providerDisplayName : undefined,
      providerMode: typeof data.providerMode === "string" ? data.providerMode : undefined,
      preferredProviderId:
        typeof data.preferredProviderId === "string" ? data.preferredProviderId : undefined,
      preferredProviderDisplayName:
        typeof data.preferredProviderDisplayName === "string"
          ? data.preferredProviderDisplayName
          : undefined,
      name: typeof data.name === "string" ? data.name : undefined,
      phone: typeof data.phone === "string" ? data.phone : undefined,
      email: typeof data.email === "string" ? data.email : undefined,
      notes: typeof data.notes === "string" && data.notes.length ? data.notes : undefined,
      status,
      accepted: actor(data.acceptedByUid, data.acceptedByEmail, data.acceptedAt, undefined),
      declined: actor(
        data.declinedByUid,
        data.declinedByEmail,
        data.declinedAt,
        data.declineReason,
      ),
      cancelled: actor(
        data.cancelledByUid,
        data.cancelledByEmail,
        data.cancelledAt,
        data.cancelReason,
      ),
      createdAtMs: timestampToMs(data.createdAt),
    };

    if (!matchesQuery(row, q)) continue;
    rows.push(row);
  }

  return NextResponse.json({ bookings: rows });
}
