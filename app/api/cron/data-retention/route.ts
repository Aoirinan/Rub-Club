import { NextResponse } from "next/server";
import { runDataRetentionPurge } from "@/lib/data-retention";

export const runtime = "nodejs";

/**
 * Weekly purge of bookings, SMS logs, and inactive patient profiles older than
 * DATA_RETENTION_YEARS (default 7). Requires DATA_RETENTION_ENABLED=true.
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

  const result = await runDataRetentionPurge({ dryRun: false });

  if (result.disabled) {
    return NextResponse.json({
      ok: true,
      disabled: true,
      message:
        "Data retention purge is disabled. Set DATA_RETENTION_ENABLED=true in production to enable.",
    });
  }

  return NextResponse.json({ ok: true, ...result });
}
