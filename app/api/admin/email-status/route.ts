import { NextResponse } from "next/server";
import { requireStaff, verifyBearerUid } from "@/lib/staff-auth";

import { getSendgridApiKey, getSendgridFromEmail, getSendgridFromEmailNormalized, isValidOutboundFromEmail } from "@/lib/sendgrid";

export const runtime = "nodejs";

/**
 * Whether outbound staff/notification email can be attempted (env present).
 * Does not expose keys or addresses.
 * Managers+ and authenticated users without staff access (bootstrap/setup) may read.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const staff = await requireStaff(authHeader, "manager");
  if (!staff) {
    const decoded = await verifyBearerUid(authHeader);
    if (!decoded?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const key = getSendgridApiKey();
  const rawFrom = getSendgridFromEmail();
  const fromNorm = getSendgridFromEmailNormalized();
  const hasValidFrom = isValidOutboundFromEmail(fromNorm);
  const fromEnvInvalidFormat = rawFrom.trim().length > 0 && !hasValidFrom;

  const officeTo = process.env.OFFICE_NOTIFICATION_EMAIL?.trim() ?? "";

  return NextResponse.json({
    sendgridConfigured: Boolean(key && hasValidFrom),
    hasApiKey: Boolean(key),
    hasFromEmail: hasValidFrom,
    fromEnvInvalidFormat,
    /** Set when contact/booking office notification copies can be sent (address not exposed). */
    officeNotificationConfigured: officeTo.length > 0,
  });
}
