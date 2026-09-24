import { NextResponse } from "next/server";
import { requireStaff, verifyBearerUid } from "@/lib/staff-auth";
import { getSendgridEnvDiagnostics } from "@/lib/sendgrid";

export const runtime = "nodejs";

/**
 * Whether outbound staff/notification email can be attempted (env present).
 * Does not expose keys. Sender details (address, domain, display name) are for
 * managers+ only. Any other signed-in user (the first-time owner on
 * /admin/setup, before a staff record exists) gets just the yes/no checks that
 * page shows — anyone can create a Firebase sign-in, so nothing more.
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
  const setupChecks = {
    sendgridConfigured: diagnostics.sendgridConfigured,
    hasApiKey: diagnostics.hasApiKey,
    hasFromEmail: diagnostics.hasFromEmail,
    fromEnvInvalidFormat: diagnostics.fromEnvInvalidFormat,
  };
  if (!staff) {
    return NextResponse.json(setupChecks);
  }

  const officeTo = process.env.OFFICE_NOTIFICATION_EMAIL?.trim() ?? "";

  return NextResponse.json({
    ...setupChecks,
    apiKeyLooksValid: diagnostics.apiKeyLooksValid,
    fromLooksValid: diagnostics.fromLooksValid,
    likelySwapped: diagnostics.likelySwapped,
    fromLooksLikeApiKey: diagnostics.fromLooksLikeApiKey,
    apiKeyLooksLikeEmail: diagnostics.apiKeyLooksLikeEmail,
    fromUsesFreeMailbox: diagnostics.fromUsesFreeMailbox,
    fromEmail: diagnostics.fromEmail,
    fromEmailDomain: diagnostics.fromEmailDomain,
    fromDisplayName: diagnostics.fromDisplayName,
    isClinicFromDomain: diagnostics.isClinicFromDomain,
    isTransitionFromDomain: diagnostics.isTransitionFromDomain,
    officeNotificationConfigured: officeTo.length > 0,
  });
}
