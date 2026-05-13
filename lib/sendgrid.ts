import sgMail from "@sendgrid/mail";

let configured = false;

/**
 * Canonical names: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL (see env.example).
 * Aliases below match common Vercel typos / naming from other tools.
 */
export function getSendgridApiKey(): string {
  const v =
    process.env.SENDGRID_API_KEY?.trim() ??
    process.env.SEND_GRID?.trim() ??
    process.env.send_grid?.trim();
  return v ?? "";
}

export function getSendgridFromEmail(): string {
  const v =
    process.env.SENDGRID_FROM_EMAIL?.trim() ??
    process.env.sendgridfromemail?.trim() ??
    process.env.SENDGRIDFROMEMAIL?.trim();
  return v ?? "";
}

/** Strip quotes, first line only, optional `Name <addr>` / JSON `{"email":...}` — Vercel pastes often break SendGrid "from". */
export function normalizeSingleSenderEmail(raw: string): string {
  let s = raw.trim();
  const nl = s.search(/\r?\n/);
  if (nl >= 0) s = s.slice(0, nl).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("{")) {
    try {
      const j = JSON.parse(s) as { email?: string };
      if (typeof j.email === "string") return j.email.trim();
    } catch {
      /* ignore */
    }
  }
  const angle = s.match(/<([^<>]+@[^<>]+)>/);
  if (angle) return angle[1].trim();
  return s.trim();
}

export function getSendgridFromEmailNormalized(): string {
  return normalizeSingleSenderEmail(getSendgridFromEmail());
}

const OUTBOUND_EMAIL_RE = /^[^\s<>]+@[^\s<>]+\.[^\s<>]+$/;

export function isValidOutboundFromEmail(s: string): boolean {
  const t = s.trim();
  return t.length > 4 && t.length < 254 && OUTBOUND_EMAIL_RE.test(t);
}

function ensureSendgrid(): void {
  if (configured) return;
  const key = getSendgridApiKey();
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
  const key = getSendgridApiKey();
  const fromEmail = getSendgridFromEmailNormalized();
  if (!key || !isValidOutboundFromEmail(fromEmail)) return;

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

/** Human-readable line for superadmin when SendGrid send fails. */
function sendgridDisplayForAdmin(e: unknown): string {
  const fromErrors = sendgridUserFacingDetail(e);
  if (fromErrors) return fromErrors;

  if (typeof e === "object" && e !== null) {
    const body = (e as { response?: { body?: unknown } }).response?.body;
    if (typeof body === "string" && body.length > 0) {
      return body.slice(0, 400);
    }
    if (body && typeof body === "object") {
      const top = (body as { message?: string }).message;
      if (typeof top === "string" && top.length > 0) return top.slice(0, 400);
    }
    const msg = (e as { message?: string }).message;
    if (typeof msg === "string" && msg.length > 0) return msg.slice(0, 400);
  }

  const raw = sendgridErrorDetail(e);
  const s = raw.replace(/\s+/g, " ").trim();
  return s.length > 450 ? `${s.slice(0, 447)}…` : s;
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
  const key = getSendgridApiKey();
  const rawFrom = getSendgridFromEmail();
  const fromEmail = getSendgridFromEmailNormalized();
  if (!key || !rawFrom.trim()) {
    return { sent: false, issue: "missing_env" };
  }
  if (!isValidOutboundFromEmail(fromEmail)) {
    return {
      sent: false,
      issue: "sendgrid_error",
      sendgridDetail:
        "FROM address is not a valid email after cleaning the env value. Use only the address (e.g. russell_forsyth_1992@outlook.com): no quotes, no newlines, no JSON. If the value looks like SG.x… you may have put the API key in sendgridfromemail by mistake — swap the two variables in Vercel.",
    };
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
      sendgridDetail: sendgridDisplayForAdmin(e),
    };
  }
}
