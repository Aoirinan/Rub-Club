import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { rescheduleBookingForStartChange } from "@/lib/booking-reschedule";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const bodySchema = z.object({
  startIso: z.string().min(8),
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
    case "no_provider":
      return "This booking cannot be moved online (missing provider). Call the office.";
    case "bad_status":
      return "Only pending or confirmed appointments can be rescheduled here.";
    case "server_error":
      return "Could not reschedule.";
    default:
      return "Could not reschedule.";
  }
}

export async function POST(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const db = getFirestore();

  const result = await rescheduleBookingForStartChange(
    db,
    id,
    parsed.data.startIso,
    { uid: staff.uid, email: staff.email ?? null },
    { allowPending: true },
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: messageFor(result.code), code: result.code },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}
