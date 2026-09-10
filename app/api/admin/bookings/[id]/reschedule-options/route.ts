import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import { TIME_ZONE, type LocationId, type ServiceLine } from "@/lib/constants";
import { isValidBookingDurationMin } from "@/lib/booking-duration";
import { formatChicagoSlotChoice } from "@/lib/chicago-datetime-format";
import { fetchActiveProvidersForService } from "@/lib/providers-db";
import { providerAllowsAppointmentTime } from "@/lib/provider-scheduling";
import { providerHoursContext } from "@/lib/provider-profile";
import { requireStaff } from "@/lib/staff-auth";
import {
  bucketDocIdsForAppointment,
  effectiveDayWindowsFromHours,
  enumerateCandidateStartsInWindows,
  holdBucketIdsForPublicBooking,
} from "@/lib/slots-luxon";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Open start times for editing an EXISTING booking. Unlike the public
 * `/api/slots`, this treats the booking's own slot buckets as free (so its
 * current time is offered back) and is not gated on public booking being on.
 */
export async function GET(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const providerId = searchParams.get("providerId")?.trim();
  const serviceLine = searchParams.get("serviceLine") as ServiceLine | null;
  const durationMin = Number(searchParams.get("durationMin"));

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!providerId) {
    return NextResponse.json({ error: "providerId required" }, { status: 400 });
  }
  if (serviceLine !== "massage" && serviceLine !== "chiropractic" && serviceLine !== "stretch") {
    return NextResponse.json({ error: "Invalid serviceLine" }, { status: 400 });
  }
  if (!isValidBookingDurationMin(durationMin)) {
    return NextResponse.json({ error: "Invalid durationMin" }, { status: 400 });
  }

  const db = getFirestore();
  const snap = await db.collection("bookings").doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  const locationId = snap.get("locationId") as LocationId | undefined;
  if (locationId !== "paris" && locationId !== "sulphur_springs") {
    return NextResponse.json({ error: "Booking has no valid location" }, { status: 409 });
  }

  const eligible = await fetchActiveProvidersForService(db, locationId, serviceLine);
  const provider = eligible.find((p) => p.id === providerId);
  if (!provider) {
    return NextResponse.json({
      slots: [],
      message: "That provider is not bookable for this location and service.",
    });
  }

  const earliest = DateTime.now().setZone(TIME_ZONE).plus({ minutes: 2 });
  const windows = effectiveDayWindowsFromHours(date, providerHoursContext(provider));
  const candidates = enumerateCandidateStartsInWindows(date, durationMin, windows);

  const slots: { startIso: string; label: string }[] = [];
  for (const start of candidates) {
    if (start < earliest) continue;
    if (!providerAllowsAppointmentTime(provider, start, durationMin)) continue;

    const bucketIds = bucketDocIdsForAppointment(locationId, providerId, start, durationMin);
    const holdIds = holdBucketIdsForPublicBooking(locationId, serviceLine, start, durationMin);
    const refs = [...bucketIds, ...holdIds].map((bid) =>
      db.collection("slot_buckets").doc(bid),
    );
    const snaps = await db.getAll(...refs);
    // The booking being edited does not block itself.
    const blocked = snaps.some((s) => s.exists && s.get("bookingId") !== id);
    if (blocked) continue;

    slots.push({ startIso: start.toUTC().toISO()!, label: formatChicagoSlotChoice(start) });
  }

  return NextResponse.json({ slots });
}
