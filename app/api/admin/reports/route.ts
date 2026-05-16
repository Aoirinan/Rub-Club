import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { isBookingStatus, type BookingStatus } from "@/lib/booking-status";
import { TIME_ZONE } from "@/lib/constants";

export const runtime = "nodejs";

type DayStat = {
  date: string;
  total: number;
  confirmed: number;
  cancelled: number;
  declined: number;
  pending: number;
  massage: number;
  chiropractic: number;
};

type ProviderStat = {
  id: string;
  displayName: string;
  total: number;
  confirmed: number;
  cancelled: number;
};

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const daysBack = Math.min(180, Math.max(7, Number(searchParams.get("days")) || 30));
  const locationId = searchParams.get("locationId") || null;

  const now = DateTime.now().setZone(TIME_ZONE).startOf("day");
  const fromDt = now.minus({ days: daysBack });
  const from = Timestamp.fromMillis(fromDt.toMillis());
  const to = Timestamp.fromMillis(now.plus({ days: 1 }).toMillis());

  const db = getFirestore();
  const snap = await db
    .collection("bookings")
    .where("startAt", ">=", from)
    .where("startAt", "<=", to)
    .orderBy("startAt", "asc")
    .limit(5000)
    .get();

  const dayMap = new Map<string, DayStat>();
  const providerMap = new Map<string, ProviderStat>();
  const statusCounts: Record<BookingStatus, number> = {
    pending: 0,
    confirmed: 0,
    declined: 0,
    cancelled: 0,
  };
  const serviceCounts: Record<string, number> = { massage: 0, chiropractic: 0 };
  const locationCounts: Record<string, number> = {};
  let totalBookings = 0;
  let totalMinutes = 0;
  let paidTotal = 0;
  let paidCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    if (locationId && data.locationId !== locationId) continue;

    totalBookings++;
    const status: BookingStatus = isBookingStatus(data.status) ? data.status : "pending";
    statusCounts[status]++;

    const serviceLine = typeof data.serviceLine === "string" ? data.serviceLine : "other";
    serviceCounts[serviceLine] = (serviceCounts[serviceLine] ?? 0) + 1;

    const locId = typeof data.locationId === "string" ? data.locationId : "unknown";
    locationCounts[locId] = (locationCounts[locId] ?? 0) + 1;

    const durationMin = typeof data.durationMin === "number" ? data.durationMin : 0;
    if (status === "confirmed") totalMinutes += durationMin;

    if (typeof data.paidAmountCents === "number" && data.paidAmountCents > 0) {
      paidTotal += data.paidAmountCents;
      paidCount++;
    }

    const startAt = data.startAt instanceof Timestamp
      ? DateTime.fromMillis(data.startAt.toMillis()).setZone(TIME_ZONE)
      : null;
    const dateKey = startAt?.toFormat("yyyy-LL-dd") ?? "unknown";

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        date: dateKey,
        total: 0,
        confirmed: 0,
        cancelled: 0,
        declined: 0,
        pending: 0,
        massage: 0,
        chiropractic: 0,
      });
    }
    const day = dayMap.get(dateKey)!;
    day.total++;
    if (status === "confirmed") day.confirmed++;
    if (status === "cancelled") day.cancelled++;
    if (status === "declined") day.declined++;
    if (status === "pending") day.pending++;
    if (serviceLine === "massage") day.massage++;
    if (serviceLine === "chiropractic") day.chiropractic++;

    const provId = typeof data.providerId === "string" ? data.providerId : "unassigned";
    const provName = typeof data.providerDisplayName === "string" ? data.providerDisplayName : "Unassigned";
    if (!providerMap.has(provId)) {
      providerMap.set(provId, { id: provId, displayName: provName, total: 0, confirmed: 0, cancelled: 0 });
    }
    const prov = providerMap.get(provId)!;
    prov.total++;
    if (status === "confirmed") prov.confirmed++;
    if (status === "cancelled") prov.cancelled++;
  }

  const daily = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const providers = Array.from(providerMap.values()).sort((a, b) => b.total - a.total);

  const confirmationRate = totalBookings > 0
    ? Math.round((statusCounts.confirmed / totalBookings) * 100)
    : 0;
  const cancellationRate = totalBookings > 0
    ? Math.round((statusCounts.cancelled / totalBookings) * 100)
    : 0;

  return NextResponse.json({
    period: { from: fromDt.toFormat("yyyy-LL-dd"), to: now.toFormat("yyyy-LL-dd"), days: daysBack },
    summary: {
      totalBookings,
      statusCounts,
      serviceCounts,
      locationCounts,
      totalConfirmedMinutes: totalMinutes,
      confirmationRate,
      cancellationRate,
      paidTotal,
      paidCount,
    },
    daily,
    providers,
  });
}
