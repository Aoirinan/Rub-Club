import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { updateBookingSchedule } from "@/lib/booking-reschedule";
import { sendRescheduleNotifications } from "@/lib/booking-reschedule-notify";
import { requireStaff } from "@/lib/staff-auth";
import { isValidBookingDurationMin } from "@/lib/booking-duration";
import { recomputeNextAppointmentForBooking } from "@/lib/patients-db";

export const runtime = "nodejs";

const bodySchema = z.object({
  startIso: z.string().min(8).optional(),
  providerId: z.string().trim().min(1).max(200).optional(),
  serviceLine: z.enum(["massage", "chiropractic", "stretch"]).optional(),
  durationMin: z
    .number()
    .int()
    .refine(isValidBookingDurationMin, "Duration must be a multiple of 30 minutes.")
    .optional(),
  schedulerServiceId: z.string().trim().max(200).optional(),
});

type Params = { params: Promise<{ id: string }> };

function messageFor(code: string): string {
  switch (code) {
    case "slot_taken":
      return "That time was just taken. Pick another slot.";
    case "slot_blocked":
      return "That time is blocked by an admin hold. Remove the hold or pick another time.";
    case "outside_hours":
      return "That time is outside the provider's bookable hours.";
    case "invalid_time":
      return "Invalid start time.";
    case "invalid_duration":
      return "Length must be a multiple of 30 minutes.";
    case "unknown_service":
      return "That service is no longer in the catalog.";
    case "no_provider":
      return "That provider is not bookable for this location and service.";
    case "bad_status":
      return "Only pending or confirmed appointments can be rescheduled here.";
    case "server_error":
      return "Could not reschedule.";
    default:
      return "Could not reschedule.";
  }
}

export async function POST(req: Request, ctx: Params) {
  // Front desk is exactly who needs to move an appointment when a patient calls.
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const changes = parsed.data;
  if (
    changes.startIso === undefined &&
    changes.providerId === undefined &&
    changes.serviceLine === undefined &&
    changes.durationMin === undefined &&
    changes.schedulerServiceId === undefined
  ) {
    return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  }

  const { id } = await ctx.params;
  const db = getFirestore();

  const result = await updateBookingSchedule(
    db,
    id,
    changes,
    { uid: staff.uid, email: staff.email ?? null },
    { allowPending: true },
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: messageFor(result.code), code: result.code },
      { status: result.status },
    );
  }

  // Only a moved start time emails the patient. A provider or service swap is
  // recorded in history; staff can send a note with the "Send email" action.
  if (result.changed) {
    try {
      await sendRescheduleNotifications({
        db,
        bookingId: id,
        prevStartIso: result.prevStartIso,
        rescheduledBy: "staff",
      });
    } catch (err) {
      console.error("[admin/reschedule] email failed", err);
    }
  }

  await recomputeNextAppointmentForBooking(db, id).catch(() => {});

  return NextResponse.json({
    ok: true,
    changed: result.changed,
    providerChanged: result.providerChanged,
    serviceChanged: result.serviceChanged,
    anyChange: result.anyChange,
    notifiedPatient: result.changed,
  });
}
