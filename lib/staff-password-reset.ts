import { getAuth } from "@/lib/firebase-admin";
import { sendStaffPasswordResetEmail, type StaffInviteEmailResult } from "@/lib/sendgrid";

export type StaffPasswordResetIssue =
  | "missing_env"
  | "sendgrid_error"
  | "reset_link_failed"
  | "user_not_found";

export type StaffPasswordResetResult =
  | { sent: true }
  | { sent: false; issue: StaffPasswordResetIssue; sendgridDetail?: string };

function authErrorCode(e: unknown): string {
  if (typeof e !== "object" || e === null) return "";
  const o = e as { code?: string; errorInfo?: { code?: string } };
  return o.code ?? o.errorInfo?.code ?? "";
}

function firebaseErrorMessage(e: unknown): string | undefined {
  if (typeof e !== "object" || e === null) return undefined;
  const o = e as { message?: string; errorInfo?: { message?: string } };
  const msg = o.message ?? o.errorInfo?.message;
  return typeof msg === "string" && msg.trim() ? msg.trim() : undefined;
}

function mapEmailResult(result: StaffInviteEmailResult): StaffPasswordResetResult {
  if (result.sent) return { sent: true };
  return {
    sent: false,
    issue: result.issue,
    sendgridDetail: result.sendgridDetail,
  };
}

/** Generate a Firebase reset link and send the branded staff password-reset email. */
export async function sendStaffPasswordResetForEmail(params: {
  email: string;
  continueOrigin: string;
}): Promise<StaffPasswordResetResult> {
  const email = params.email.trim().toLowerCase();
  const continueOrigin = params.continueOrigin.replace(/\/$/, "");
  const auth = getAuth();

  try {
    await auth.getUserByEmail(email);
  } catch (lookupErr: unknown) {
    if (authErrorCode(lookupErr) === "auth/user-not-found") {
      return { sent: false, issue: "user_not_found" };
    }
    console.error("Staff password reset user lookup failed", lookupErr);
    return { sent: false, issue: "user_not_found" };
  }

  try {
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: `${continueOrigin}/auth/password-reset-complete`,
      handleCodeInApp: false,
    });

    const emailResult = await sendStaffPasswordResetEmail({
      to: email,
      resetLink,
      loginOrigin: continueOrigin,
    });
    if (!emailResult.sent) {
      console.warn("Staff password reset email not sent", emailResult.issue, emailResult.sendgridDetail);
    }
    return mapEmailResult(emailResult);
  } catch (e) {
    console.error("Staff password reset link failed", e);
    return {
      sent: false,
      issue: "reset_link_failed",
      sendgridDetail: firebaseErrorMessage(e),
    };
  }
}
