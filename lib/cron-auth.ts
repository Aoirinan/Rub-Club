import { NextResponse } from "next/server";
import { secretsMatch } from "./superadmin-auth";

/**
 * Shared auth for `/api/cron/*` GET handlers.
 *
 * - When `CRON_SECRET` is set (any environment) the request must carry
 *   `Authorization: Bearer <CRON_SECRET>` (constant-time compare).
 * - When it is unset, the route is only reachable on local/dev runs: never on
 *   Vercel production or preview deployments, which share live Firebase and
 *   SendGrid credentials.
 *
 * Returns a response to send when the request is rejected, or `null` to proceed.
 */
export async function authorizeCronRequest(req: Request): Promise<NextResponse | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET?.trim();
  const vercelEnv = process.env.VERCEL_ENV;
  const isDeployed = vercelEnv === "production" || vercelEnv === "preview";

  if (cronSecret) {
    const provided = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
    if (!(await secretsMatch(provided, cronSecret))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
  }

  if (isDeployed || process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET must be set for deployed cron." },
      { status: 503 },
    );
  }
  return null;
}
