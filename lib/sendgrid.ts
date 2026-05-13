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

/** Returns true if SendGrid accepted the message. */
export async function sendStaffInviteEmail(params: {
  to: string;
  resetLink: string;
  inviterNote?: string;
  subject?: string;
}): Promise<boolean> {
  ensureSendgrid();
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!key || !from) return false;

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
    return true;
  } catch (e) {
    console.error("SendGrid staff invite failed", e);
    return false;
  }
}
