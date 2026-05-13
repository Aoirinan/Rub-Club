import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";

import { getSendgridApiKey, getSendgridFromEmail, getSendgridFromEmailNormalized, isValidOutboundFromEmail } from "@/lib/sendgrid";

export const runtime = "nodejs";

/**
 * Whether outbound staff/notification email can be attempted (env present).
 * Does not expose keys or addresses.
 */
export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = getSendgridApiKey();
  const rawFrom = getSendgridFromEmail();
  const fromNorm = getSendgridFromEmailNormalized();
  const hasValidFrom = isValidOutboundFromEmail(fromNorm);
  const fromEnvInvalidFormat = rawFrom.trim().length > 0 && !hasValidFrom;

  return NextResponse.json({
    sendgridConfigured: Boolean(key && hasValidFrom),
    hasApiKey: Boolean(key),
    hasFromEmail: hasValidFrom,
    fromEnvInvalidFormat,
  });
}
