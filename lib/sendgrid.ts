import sgMail from "@sendgrid/mail";

let configured = false;

function ensureSendgrid(): void {
  if (configured) return;
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return;
  sgMail.setApiKey(key);
  configured = true;
}

export async function sendBookingNotification(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  ensureSendgrid();
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!key || !from) return;

  await sgMail.send({
    to: params.to,
    from,
    subject: params.subject,
    text: params.text,
    html: params.html ?? `<pre>${escapeHtml(params.text)}</pre>`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export type StaffInviteEmailIssue = "missing_env" | "sendgrid_error";

export type StaffInviteEmailResult =
  | { sent: true }
  | { sent: false; issue: StaffInviteEmailIssue };

function sendgridErrorDetail(e: unknown): string {
  if (typeof e !== "object" || e === null) return String(e);
  const o = e as { message?: string; response?: { body?: unknown } };
  if (o.response?.body !== undefined) {
    try {
      return JSON.stringify(o.response.body);
    } catch {
      return o.message ?? "SendGrid error";
    }
  }
  return o.message ?? String(e);
}

/** SendGrid accepted the message, or a stable reason this deployment did not send. */
export async function sendStaffInviteEmail(params: {
  to: string;
  resetLink: string;
  inviterNote?: string;
  subject?: string;
}): Promise<StaffInviteEmailResult> {
  ensureSendgrid();
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!key || !from) {
    return { sent: false, issue: "missing_env" };
  }

  const note =
    params.inviterNote ?? "You have been invited to the staff portal.";
  const subject = params.subject ?? "Staff portal — set your password";
  const text = [
    note,
    "",
    "Use this link to sign in or set a new password:",
    params.resetLink,
    "",
    "If the link expires, use “Forgot password” on the staff sign-in page with this email address.",
  ].join("\n");

  try {
    await sgMail.send({
      to: params.to,
      from,
      subject,
      text,
      html: `<p>${escapeHtml(note)}</p><p><a href="${params.resetLink}">Open staff portal link</a></p>`,
    });
    return { sent: true };
  } catch (e) {
    console.error("SendGrid staff invite failed:", sendgridErrorDetail(e));
    return { sent: false, issue: "sendgrid_error" };
  }
}
