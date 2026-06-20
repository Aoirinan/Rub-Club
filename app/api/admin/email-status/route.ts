import { NextResponse } from "next/server";
import { requireStaff, verifyBearerUid } from "@/lib/staff-auth";
import { getSendgridEnvDiagnostics } from "@/lib/sendgrid";

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

  const diagnostics = getSendgridEnvDiagnostics();
  const officeTo = process.env.OFFICE_NOTIFICATION_EMAIL?.trim() ?? "";

  return NextResponse.json({
    sendgridConfigured: diagnostics.sendgridConfigured,
    hasApiKey: diagnostics.hasApiKey,
    hasFromEmail: diagnostics.hasFromEmail,
    fromEnvInvalidFormat: diagnostics.fromEnvInvalidFormat,
    apiKeyLooksValid: diagnostics.apiKeyLooksValid,
    fromLooksValid: diagnostics.fromLooksValid,
    likelySwapped: diagnostics.likelySwapped,
    fromLooksLikeApiKey: diagnostics.fromLooksLikeApiKey,
    apiKeyLooksLikeEmail: diagnostics.apiKeyLooksLikeEmail,
    officeNotificationConfigured: officeTo.length > 0,
  });
}
