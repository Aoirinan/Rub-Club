import sgMail from "@sendgrid/mail";
import { emailFromName, siteShortName } from "@/lib/site-content";
import { getPublicAppOrigin } from "@/lib/app-origin";

let configured = false;

/**
 * Canonical names: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL (see env.example).
 * Aliases below match common Vercel typos / naming from other tools.
 */
function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return "";
}

export function getSendgridApiKey(): string {
  return resolveSendgridCredentials().key;
}

export function getSendgridFromEmail(): string {
  return resolveSendgridCredentials().fromRaw;
}

function resolveSendgridCredentials(): { key: string; fromRaw: string } {
  const key = firstNonEmpty(
    process.env.SENDGRID_API_KEY,
    process.env.SEND_GRID,
    process.env.send_grid,
  );
  const fromRaw = firstNonEmpty(
    process.env.SENDGRID_FROM_EMAIL,
    process.env.sendgridfromemail,
    process.env.SENDGRIDFROMEMAIL,
  );

  const keyLooksEmail = isValidOutboundFromEmail(key);
  const fromLooksSg = fromRaw.startsWith("SG.");

  if (fromLooksSg && keyLooksEmail) {
    return { key: fromRaw, fromRaw: key };
  }

  return { key, fromRaw };
}

function getSendgridFromEmailNormalizedFromRaw(raw: string): string {
  return normalizeSingleSenderEmail(raw);
}

export type SendgridEnvDiagnostics = {
  hasApiKey: boolean;
  hasFromEmail: boolean;
  sendgridConfigured: boolean;
  fromEnvInvalidFormat: boolean;
  /** API key env looks like SG.xxx */
  apiKeyLooksValid: boolean;
  /** FROM env normalizes to a valid email */
  fromLooksValid: boolean;
  /** FROM has SG. prefix — likely swapped with API key in Vercel */
  fromLooksLikeApiKey: boolean;
  /** API key env looks like an email — likely swapped with FROM in Vercel */
  apiKeyLooksLikeEmail: boolean;
  likelySwapped: boolean;
  /** FROM uses gmail/outlook/etc. — often lands in spam without domain authentication */
  fromUsesFreeMailbox: boolean;
};

const FREE_MAILBOX_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "aol.com",
]);

export function getSendgridReplyToEmail(): string | undefined {
  const raw = firstNonEmpty(
    process.env.SENDGRID_REPLY_TO,
    process.env.RESCHEDULE_EMAIL,
    process.env.OFFICE_NOTIFICATION_EMAIL,
  );
  const normalized = normalizeSingleSenderEmail(raw);
  return isValidOutboundFromEmail(normalized) ? normalized : undefined;
}

export function getSendgridEnvDiagnostics(): SendgridEnvDiagnostics {
  const { key, fromRaw } = resolveSendgridCredentials();
  const fromNorm = getSendgridFromEmailNormalizedFromRaw(fromRaw);
  const hasApiKey = Boolean(key);
  const hasFromEmail = Boolean(fromRaw);
  const fromLooksValid = isValidOutboundFromEmail(fromNorm);
  const apiKeyLooksValid = key.startsWith("SG.");
  const fromLooksLikeApiKey = fromRaw.startsWith("SG.");
  const apiKeyLooksLikeEmail = isValidOutboundFromEmail(key);
  const likelySwapped = fromLooksLikeApiKey && apiKeyLooksLikeEmail;
  const fromEnvInvalidFormat = hasFromEmail && !fromLooksValid && !fromLooksLikeApiKey;
  const fromDomain = fromNorm.split("@")[1]?.toLowerCase() ?? "";
  const fromUsesFreeMailbox = fromLooksValid && FREE_MAILBOX_DOMAINS.has(fromDomain);

  return {
    hasApiKey,
    hasFromEmail,
    sendgridConfigured: hasApiKey && fromLooksValid,
    fromEnvInvalidFormat,
    apiKeyLooksValid,
    fromLooksValid,
    fromLooksLikeApiKey,
    apiKeyLooksLikeEmail,
    likelySwapped,
    fromUsesFreeMailbox,
  };
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

export type EmailAttachment = {
  filename: string;
  /** Base64-encoded content. */
  content: string;
  type: string;
  disposition?: "attachment" | "inline";
};

export type OutboundEmailResult =
  | { ok: true }
  | { ok: false; reason: "missing_api_key" | "invalid_from_email" | "send_failed"; detail?: string };

/** Sends mail when SendGrid is configured; returns whether delivery was attempted successfully. */
export async function sendOutboundEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
  fromName?: string;
}): Promise<OutboundEmailResult> {
  ensureSendgrid();
  const key = getSendgridApiKey();
  const fromEmail = getSendgridFromEmailNormalized();
  if (!key) {
    console.warn("[sendgrid] SENDGRID_API_KEY is missing — email NOT sent to", params.to);
    return { ok: false, reason: "missing_api_key" };
  }
  if (!isValidOutboundFromEmail(fromEmail)) {
    console.warn("[sendgrid] SENDGRID_FROM_EMAIL is missing or invalid — email NOT sent to", params.to);
    return { ok: false, reason: "invalid_from_email" };
  }

  try {
    await sgMail.send({
    to: params.to,
    from: { email: fromEmail, name: params.fromName ?? emailFromName },
    ...(getSendgridReplyToEmail() ? { replyTo: getSendgridReplyToEmail() } : {}),
    subject: params.subject,
    text: params.text,
    html: params.html ?? `<pre>${escapeHtml(params.text)}</pre>`,
    attachments: params.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      type: a.type,
      disposition: a.disposition ?? "attachment",
    })),
    trackingSettings: {
      clickTracking: { enable: false },
      openTracking: { enable: false },
    },
    });
    return { ok: true };
  } catch (err) {
    console.error("[sendgrid] send failed to", params.to, err);
    return { ok: false, reason: "send_failed", detail: sendgridDisplayForAdmin(err) };
  }
}

export async function sendBookingNotification(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
  fromName?: string;
}): Promise<void> {
  const result = await sendOutboundEmail(params);
  if (!result.ok) return;
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
export function sendgridDisplayForAdmin(e: unknown): string {
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
  const subject = params.subject ?? `Your ${siteShortName} staff sign-in`;
  const loginUrl = `${getPublicAppOrigin()}/admin/login`;
  const text = [
    note,
    "",
    "Set your password or sign in using this link:",
    params.resetLink,
    "",
    `Staff sign-in page: ${loginUrl}`,
    "",
    "If the link expires, open the staff sign-in page and use Forgot password with this email address.",
    "",
    "— Chiropractic Associates / The Rub Club (Paris & Sulphur Springs, TX)",
  ].join("\n");

  const safeHref = escapeHtml(params.resetLink);
  const safeLogin = escapeHtml(loginUrl);
  const html = [
    `<p>${escapeHtml(note)}</p>`,
    `<p><a href="${safeHref}">Set your password or open the staff portal</a></p>`,
    `<p style="font-size:14px;color:#444">Or copy this link into your browser:<br><span style="word-break:break-all">${safeHref}</span></p>`,
    `<p style="font-size:14px;color:#444">Staff sign-in: <a href="${safeLogin}">${safeLogin}</a></p>`,
    `<p style="font-size:12px;color:#666;margin-top:24px">Chiropractic Associates · The Rub Club · Paris &amp; Sulphur Springs, TX</p>`,
  ].join("");

  try {
    await sgMail.send({
      to: params.to,
      from: { email: fromEmail, name: emailFromName },
      ...(getSendgridReplyToEmail() ? { replyTo: getSendgridReplyToEmail() } : {}),
      subject,
      text,
      html,
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false },
      },
      mailSettings: {
        bypassListManagement: { enable: true },
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
