import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import type { ServiceLine } from "@/lib/constants";
import { APPOINTMENT_STARTED_MESSAGE, appointmentHasStarted } from "@/lib/appointment-started";
import { listOpenStartsForExistingBooking } from "@/lib/booking-reschedule-slots";
import { findBookingByPortalToken } from "@/lib/patient-portal-lookup";
import { fetchActiveProvidersForService } from "@/lib/providers-db";
import { assertRateLimitOk } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  token: z.string().min(16).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const NO_STORE = { "cache-control": "private, no-store, must-revalidate" };

function numberOr(raw: unknown, fallback: number): number {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
}

/**
 * Open times for the manage-appointment page. The token travels in the POST
 * body (never a query string) and stands in for the public booking switch:
 * staff send manage links even while online booking is off. Times use the
 * booking's own location, service, provider, length and buffers, with the same
 * rules the reschedule save enforces.
 */
export async function POST(req: Request) {
  // Own bucket so browsing dates can't lock the patient out of confirming.
  const rl = await assertRateLimitOk(req.headers, { bucket: "patient-portal-slots", maxPerWindow: 120 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again soon." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const db = getFirestore();
  const snap = await findBookingByPortalToken(db, parsed.data.token);
  if (!snap) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  if (snap.get("status") !== "confirmed") {
    return NextResponse.json(
      { error: "This appointment is no longer active online." },
      { status: 410 },
    );
  }
  if (appointmentHasStarted(snap.get("startIso"))) {
    return NextResponse.json({ error: APPOINTMENT_STARTED_MESSAGE }, { status: 409 });
  }

  const locationId = snap.get("locationId");
  const serviceLine = snap.get("serviceLine") as ServiceLine | undefined;
  const durationMin = snap.get("durationMin");
  const providerId = snap.get("providerId");
  if (
    (locationId !== "paris" && locationId !== "sulphur_springs") ||
    (serviceLine !== "massage" && serviceLine !== "chiropractic" && serviceLine !== "stretch") ||
    typeof durationMin !== "number" ||
    typeof providerId !== "string" ||
    !providerId.trim()
  ) {
    return NextResponse.json(
      { error: "This appointment cannot be rescheduled online. Call the office." },
      { status: 409 },
    );
  }

  try {
    // Same provider lookup as the reschedule save (a provider no longer taking
    // new clients still sees their existing patients).
    const eligible = await fetchActiveProvidersForService(db, locationId, serviceLine);
    const provider = eligible.find((p) => p.id === providerId.trim());
    if (!provider) {
      return NextResponse.json(
        { slots: [], message: "Online rescheduling is not available for this appointment. Call the office." },
        { headers: NO_STORE },
      );
    }

    const open = await listOpenStartsForExistingBooking(db, {
      bookingId: snap.id,
      locationId,
      provider,
      serviceLine,
      durationMin,
      bufferBeforeMinutes: numberOr(snap.get("bufferBeforeMinutes"), 0),
      bufferAfterMinutes: numberOr(snap.get("bufferAfterMinutes"), 0),
      date: parsed.data.date,
    });
    // The current time is not a new time.
    const currentMs = DateTime.fromISO(String(snap.get("startIso") ?? ""), { setZone: true }).toMillis();
    const slots = open.filter(
      (s) => DateTime.fromISO(s.startIso, { setZone: true }).toMillis() !== currentMs,
    );
    return NextResponse.json({ slots }, { headers: NO_STORE });
  } catch (e) {
    console.error("[patient/booking/slots]", e);
    return NextResponse.json({ error: "Could not load times." }, { status: 500 });
  }
}
