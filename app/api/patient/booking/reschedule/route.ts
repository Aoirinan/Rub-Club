import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { rescheduleBookingForStartChange } from "@/lib/booking-reschedule";
import { findBookingByPortalToken } from "@/lib/patient-portal-lookup";
import { assertRateLimitOk } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  token: z.string().min(16).max(500),
  startIso: z.string().min(8),
});

function messageFor(code: string): string {
  switch (code) {
    case "slot_taken":
      return "That time was just taken. Pick another slot.";
    case "slot_blocked":
      return "That time is blocked. Pick another slot.";
    case "outside_hours":
      return "That time is outside bookable hours for this provider.";
    case "invalid_time":
      return "Invalid start time.";
    case "no_provider":
      return "This appointment cannot be rescheduled online. Call the office.";
    case "bad_status":
      return "Only confirmed appointments can be rescheduled online.";
    default:
      return "Could not reschedule.";
  }
}

export async function POST(req: Request) {
  const rl = await assertRateLimitOk(req.headers);
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

  const result = await rescheduleBookingForStartChange(
    db,
    snap.id,
    parsed.data.startIso,
    { uid: null, email: "patient/portal" },
    { allowPending: false },
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: messageFor(result.code), code: result.code },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}
