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
  /** Normalized FROM address (safe to show managers — not a secret). */
  fromEmail?: string;
  fromEmailDomain?: string;
  fromDisplayName: string;
  /** True when FROM is on the clinic production domain (post-cutover). */
  isClinicFromDomain: boolean;
  /** True when FROM is a developer transition domain (expected before clinic DNS access). */
  isTransitionFromDomain: boolean;
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

/** Inbox display name for outbound mail. Override with SENDGRID_FROM_NAME in Vercel. */
export function getSendgridFromDisplayName(): string {
  const custom = process.env.SENDGRID_FROM_NAME?.trim();
  return custom || emailFromName;
}

const CLINIC_EMAIL_DOMAINS = ["chiropracticparistexas.com", "chiropracticassociates.com"];

export function isClinicFromDomain(fromEmail: string): boolean {
  const domain = fromEmail.split("@")[1]?.toLowerCase() ?? "";
  return CLINIC_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

export function isTransitionFromDomain(fromEmail: string): boolean {
  if (!isValidOutboundFromEmail(fromEmail)) return false;
  const domain = fromEmail.split("@")[1]?.toLowerCase() ?? "";
  if (FREE_MAILBOX_DOMAINS.has(domain)) return false;
  return !isClinicFromDomain(fromEmail);
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
    fromEmail: fromLooksValid ? fromNorm : undefined,
    fromEmailDomain: fromLooksValid ? fromDomain : undefined,
    fromDisplayName: getSendgridFromDisplayName(),
    isClinicFromDomain: fromLooksValid ? isClinicFromDomain(fromNorm) : false,
    isTransitionFromDomain: fromLooksValid ? isTransitionFromDomain(fromNorm) : false,
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
    from: { email: fromEmail, name: params.fromName ?? getSendgridFromDisplayName() },
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

type StaffPortalEmailContent = {
  subject: string;
  preheader: string;
  headline: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaHref: string;
  loginUrl: string;
  footerLines: string[];
  category: string;
};

function buildStaffPortalEmailHtml(content: StaffPortalEmailContent): string {
  const PRIMARY = "#c0392b";
  const ACCENT = "#f19f1f";
  const TEXT = "#4a1515";
  const MUTED = "#5b6360";
  const safeHref = escapeHtml(content.ctaHref);
  const safeLogin = escapeHtml(content.loginUrl);
  const bodyHtml = content.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;color:${TEXT};font-size:15px;line-height:1.55">${escapeHtml(p)}</p>`,
    )
    .join("");
  const footerHtml = content.footerLines
    .map(
      (line) =>
        `<p style="margin:0 0 8px;color:${MUTED};font-size:12px;line-height:1.5">${escapeHtml(line)}</p>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ea;font-family:Arial,Helvetica,sans-serif;color:${TEXT};">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(content.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ea;padding:32px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;background:#ffffff;border-top:6px solid ${PRIMARY};box-shadow:0 1px 2px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:24px 24px 0">
              <p style="margin:0;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:${PRIMARY};">
                ${escapeHtml(siteShortName)} · Staff portal
              </p>
              <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;color:${TEXT};">${escapeHtml(content.headline)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 24px">
              ${bodyHtml}
              <p style="margin:0 0 20px">
                <a href="${safeHref}" style="display:inline-block;background:${ACCENT};color:${TEXT};text-decoration:none;font-size:14px;font-weight:900;letter-spacing:1px;text-transform:uppercase;padding:14px 22px;border-radius:6px">${escapeHtml(content.ctaLabel)}</a>
              </p>
              <p style="margin:0 0 16px;color:${MUTED};font-size:13px;line-height:1.5">If the button does not work, copy this link into your browser:<br><span style="word-break:break-all;color:${TEXT}">${safeHref}</span></p>
              <p style="margin:0 0 16px;color:${MUTED};font-size:13px;line-height:1.5">Staff sign-in page: <a href="${safeLogin}" style="color:${PRIMARY};font-weight:700">${safeLogin}</a></p>
              ${footerHtml}
              <p style="margin:16px 0 0;padding-top:16px;border-top:1px solid #e6e2d3;color:${MUTED};font-size:12px;line-height:1.5;">
                Paris office: <a href="tel:+19037855551" style="color:${PRIMARY};">903-785-5551</a> ·
                The Rub Club: <a href="tel:+19037399959" style="color:${PRIMARY};">903-739-9959</a> ·
                Sulphur Springs: <a href="tel:+19039195020" style="color:${PRIMARY};">903-919-5020</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildStaffPortalEmailText(content: StaffPortalEmailContent): string {
  return [
    content.headline,
    "",
    ...content.paragraphs,
    "",
    `${content.ctaLabel}:`,
    content.ctaHref,
    "",
    `Staff sign-in page: ${content.loginUrl}`,
    "",
    ...content.footerLines,
  ].join("\n");
}

async function sendStaffPortalEmail(
  to: string,
  content: StaffPortalEmailContent,
): Promise<StaffInviteEmailResult> {
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
        "FROM address is not a valid email after cleaning the env value. Use only the address (e.g. scheduling@massageparistx.com): no quotes, no newlines, no JSON. If the value looks like SG.x… you may have put the API key in sendgridfromemail by mistake — swap the two variables in Vercel.",
    };
  }

  const text = buildStaffPortalEmailText(content);
  const html = buildStaffPortalEmailHtml(content);

  try {
    await sgMail.send({
      to,
      from: { email: fromEmail, name: getSendgridFromDisplayName() },
      ...(getSendgridReplyToEmail() ? { replyTo: getSendgridReplyToEmail() } : {}),
      subject: content.subject,
      text,
      html,
      categories: [content.category],
      headers: {
        "X-Entity-Ref-ID": content.category,
      },
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
    console.error(`SendGrid ${content.category} failed:`, sendgridErrorDetail(e));
    return {
      sent: false,
      issue: "sendgrid_error",
      sendgridDetail: sendgridDisplayForAdmin(e),
    };
  }
}

/** Branded password reset — always SendGrid, never Firebase's noreply@firebaseapp.com mailer. */
export async function sendStaffPasswordResetEmail(params: {
  to: string;
  resetLink: string;
  loginOrigin?: string;
}): Promise<StaffInviteEmailResult> {
  const loginUrl = `${(params.loginOrigin ?? getPublicAppOrigin()).replace(/\/$/, "")}/admin/login`;

  return sendStaffPortalEmail(params.to, {
    subject: `${siteShortName} — reset your staff portal password`,
    preheader: "Use this link to set a new password for the staff scheduling portal.",
    headline: "Reset your staff password",
    paragraphs: [
      "You requested a password reset for the Chiropractic Associates / The Rub Club staff portal.",
    ],
    ctaLabel: "Set a new password",
    ctaHref: params.resetLink,
    loginUrl,
    footerLines: [
      "If you did not request this reset, you can ignore this email.",
      `${siteShortName} · The Rub Club · Paris & Sulphur Springs, TX`,
    ],
    category: "staff-password-reset",
  });
}

/** SendGrid accepted the message, or a stable reason this deployment did not send. */
export async function sendStaffInviteEmail(params: {
  to: string;
  resetLink: string;
  inviterNote?: string;
  subject?: string;
  loginOrigin?: string;
}): Promise<StaffInviteEmailResult> {
  const note =
    params.inviterNote ?? "You have been invited to the staff portal.";
  const subject = params.subject ?? `Your ${siteShortName} staff sign-in`;
  const loginUrl = `${(params.loginOrigin ?? getPublicAppOrigin()).replace(/\/$/, "")}/admin/login`;

  return sendStaffPortalEmail(params.to, {
    subject,
    preheader: "Set your password and sign in to the staff scheduling portal.",
    headline: "Your staff portal access",
    paragraphs: [note, "Use the button below to set your password."],
    ctaLabel: "Set your password",
    ctaHref: params.resetLink,
    loginUrl,
    footerLines: [
      "If the link expires, ask a superadmin to send a new password reset link from Scheduling & team.",
      `${siteShortName} · The Rub Club · Paris & Sulphur Springs, TX`,
    ],
    category: "staff-invite",
  });
}

/** Notify a former staff member that portal access was removed. */
export async function sendStaffAccessRevokedEmail(params: {
  to: string;
  loginOrigin?: string;
}): Promise<StaffInviteEmailResult> {
  const loginUrl = `${(params.loginOrigin ?? getPublicAppOrigin()).replace(/\/$/, "")}/admin/login`;

  return sendStaffPortalEmail(params.to, {
    subject: `${siteShortName} — staff portal access removed`,
    preheader: "Your staff portal sign-in has been deactivated.",
    headline: "Staff access removed",
    paragraphs: [
      "Your access to the Chiropractic Associates / The Rub Club staff scheduling portal has been removed.",
      "If you believe this is a mistake, contact your office manager or a superadmin.",
    ],
    ctaLabel: "Staff sign-in page",
    ctaHref: loginUrl,
    loginUrl,
    footerLines: [
      "Do not attempt to sign in with old credentials — your account has been deactivated.",
      `${siteShortName} · The Rub Club · Paris & Sulphur Springs, TX`,
    ],
    category: "staff-access-revoked",
  });
}
