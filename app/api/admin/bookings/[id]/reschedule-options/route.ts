import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import type { LocationId, ServiceLine } from "@/lib/constants";
import {
  isValidAdminBookingDurationMin,
  resolveTargetService,
} from "@/lib/booking-reschedule";
import { listOpenStartsForExistingBooking } from "@/lib/booking-reschedule-slots";
import { fetchActiveProvidersForService } from "@/lib/providers-db";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function serviceMessage(code: "unknown_service" | "inactive_service" | "service_line_mismatch"): string {
  if (code === "inactive_service") return "That service type is no longer active. Pick another.";
  if (code === "service_line_mismatch") {
    return "That service type does not belong to the chosen service. Pick one that matches.";
  }
  return "That service is no longer in the catalog.";
}

/**
 * Open start times for editing an EXISTING booking. Unlike the public
 * `/api/slots`, this treats the booking's own slot buckets as free (so its
 * current time is offered back) and is not gated on public booking being on.
 * It applies the buffers and time bounds the save enforces, so every time it
 * offers can actually be saved.
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
  // Absent: keep the booking's catalog service. "" clears it. Decides buffers.
  const schedulerServiceId = searchParams.get("schedulerServiceId") ?? undefined;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!providerId) {
    return NextResponse.json({ error: "providerId required" }, { status: 400 });
  }
  if (serviceLine !== "massage" && serviceLine !== "chiropractic" && serviceLine !== "stretch") {
    return NextResponse.json({ error: "Invalid serviceLine" }, { status: 400 });
  }

  const db = getFirestore();
  const snap = await db.collection("bookings").doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  const booking = snap.data()!;
  const locationId = booking.locationId as LocationId | undefined;
  if (locationId !== "paris" && locationId !== "sulphur_springs") {
    return NextResponse.json({ error: "Booking has no valid location" }, { status: 409 });
  }
  // The save only checks a CHANGED length, so the booking's current one is fine too.
  if (!isValidAdminBookingDurationMin(durationMin) && durationMin !== booking.durationMin) {
    return NextResponse.json({ error: "Invalid durationMin" }, { status: 400 });
  }

  const svc = await resolveTargetService(db, booking, schedulerServiceId, serviceLine);
  if (!svc.ok) {
    return NextResponse.json({ slots: [], message: serviceMessage(svc.code) });
  }

  const eligible = await fetchActiveProvidersForService(db, locationId, serviceLine);
  const provider = eligible.find((p) => p.id === providerId);
  if (!provider) {
    return NextResponse.json({
      slots: [],
      message: "That provider is not bookable for this location and service.",
    });
  }

  const slots = await listOpenStartsForExistingBooking(db, {
    bookingId: id,
    locationId,
    provider,
    serviceLine,
    durationMin,
    bufferBeforeMinutes: svc.bufferBeforeMinutes,
    bufferAfterMinutes: svc.bufferAfterMinutes,
    date,
  });

  return NextResponse.json({ slots });
}
