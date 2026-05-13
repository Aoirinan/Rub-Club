import sgMail from "@sendgrid/mail";

let configured = false;

function ensureSendgrid(): void {
  if (configured) return;
  const key = process.env.SENDGRID_API_KEY?.trim();
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
  const key = process.env.SENDGRID_API_KEY?.trim();
  const fromEmail = process.env.SENDGRID_FROM_EMAIL?.trim();
  if (!key || !fromEmail) return;

  await sgMail.send({
    to: params.to,
    from: { email: fromEmail, name: "Paris Wellness Bookings" },
    subject: params.subject,
    text: params.text,
    html: params.html ?? `<pre>${escapeHtml(params.text)}</pre>`,
    trackingSettings: {
      clickTracking: { enable: false },
      openTracking: { enable: false },
    },
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
  | { sent: false; issue: StaffInviteEmailIssue; sendgridDetail?: string };

/** First SendGrid API error message, safe to show a superadmin. */
function sendgridUserFacingDetail(e: unknown): string | undefined {
  if (typeof e !== "object" || e === null) return undefined;
  const body = (e as { response?: { body?: unknown } }).response?.body;
  if (!body || typeof body !== "object") return undefined;
  const errors = (body as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || errors.length === 0) return undefined;
  const msg = (errors[0] as { message?: string; field?: string }).message;
  if (typeof msg === "string" && msg.length > 0) return msg.slice(0, 400);
  return undefined;
}

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
  const key = process.env.SENDGRID_API_KEY?.trim();
  const fromEmail = process.env.SENDGRID_FROM_EMAIL?.trim();
  if (!key || !fromEmail) {
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

  const safeHref = escapeHtml(params.resetLink);

  try {
    await sgMail.send({
      to: params.to,
      from: { email: fromEmail, name: "Paris Wellness Staff" },
      subject,
      text,
      html: `<p>${escapeHtml(note)}</p><p><a href="${safeHref}">Open staff portal link</a></p>`,
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false },
      },
    });
    return { sent: true };
  } catch (e) {
    console.error("SendGrid staff invite failed:", sendgridErrorDetail(e));
    return {
      sent: false,
      issue: "sendgrid_error",
      sendgridDetail: sendgridUserFacingDetail(e),
    };
  }
}
