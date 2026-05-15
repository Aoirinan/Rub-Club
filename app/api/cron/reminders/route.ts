import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Legacy hourly cron entrypoint. Automated reminder email/SMS is intentionally disabled —
 * staff use **Scheduler → Send reminders** (`POST /api/admin/reminders/send`) so messages
 * are never fired on a silent timer.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  const isVercelProduction = process.env.VERCEL_ENV === "production";

  if (isVercelProduction) {
    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET must be set for production cron." },
        { status: 503 },
      );
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
