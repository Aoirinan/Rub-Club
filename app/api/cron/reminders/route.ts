import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron-auth";

export const runtime = "nodejs";

/**
 * Legacy hourly cron entrypoint. Automated reminder email/SMS is intentionally disabled —
 * staff use **Scheduler → Send reminders** (`POST /api/admin/reminders/send`) so messages
 * are never fired on a silent timer.
 */
export async function GET(req: Request) {
  const denied = await authorizeCronRequest(req);
  if (denied) return denied;

  return NextResponse.json({
    ok: true,
    disabled: true,
    message:
      "Automatic reminder sends are turned off. Use the admin scheduler “Send reminders” action (manual) instead.",
    total: 0,
    sent: 0,
    skipped: 0,
  });
}
