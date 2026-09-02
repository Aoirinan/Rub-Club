import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { runDataRetentionPurge } from "@/lib/data-retention";

export const runtime = "nodejs";

/**
 * Weekly purge of bookings, SMS logs, and inactive patient profiles older than
 * DATA_RETENTION_YEARS (default 7). Requires DATA_RETENTION_ENABLED=true.
 */
export async function GET(req: Request) {
  const denied = await authorizeCronRequest(req);
  if (denied) return denied;

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
