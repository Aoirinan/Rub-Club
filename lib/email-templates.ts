import { DateTime } from "luxon";
import {
  LOCATIONS,
  type DurationMin,
  type LocationId,
  type ServiceLine,
} from "@/lib/constants";
import {
  formatChicagoDateTimeLong,
  formatChicagoDateTimeShort,
} from "@/lib/chicago-datetime-format";
import { siteShortName, siteUrl } from "@/lib/site-content";

export type BookingEmailContext = {
  bookingId: string;
  locationId: LocationId;
  serviceLine: ServiceLine;
  durationMin: DurationMin;
  start: DateTime;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  providerDisplayName: string;
  providerMode: "specific" | "any";
  preferredProviderName?: string;
};

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const PRIMARY = "#0f5f5c";
const ACCENT = "#f2d25d";
const TEXT = "#173f3b";
const MUTED = "#5b6360";

function brandedShell(params: {
  preheader: string;
  heading: string;
  body: string;
  ctaText?: string;
  ctaHref?: string;
}): string {
  const cta =
    params.ctaText && params.ctaHref
      ? `
      <tr><td style="padding:8px 24px 24px 24px;">
        <a href="${escapeHtml(params.ctaHref)}"
           style="display:inline-block;background:${ACCENT};color:${TEXT};
                  font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:14px;
                  letter-spacing:1px;text-transform:uppercase;text-decoration:none;
                  padding:14px 22px;border-radius:6px;">
          ${escapeHtml(params.ctaText)}
        </a>
      </td></tr>`
      : "";

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(params.heading)}</title></head>
<body style="margin:0;padding:0;background:#f4f2ea;font-family:Arial,Helvetica,sans-serif;color:${TEXT};">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(params.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ea;">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;border-top:6px solid ${PRIMARY};
                    box-shadow:0 1px 2px rgba(0,0,0,0.06);">
        <tr><td style="padding:24px 24px 0 24px;">
          <p style="margin:0;font-size:12px;font-weight:900;letter-spacing:2px;
                    text-transform:uppercase;color:${PRIMARY};">
            ${escapeHtml(siteShortName)}
          </p>
          <h1 style="margin:8px 0 0 0;font-size:24px;color:${TEXT};">${escapeHtml(params.heading)}</h1>
        </td></tr>
        <tr><td style="padding:12px 24px 0 24px;font-size:15px;line-height:1.55;color:${TEXT};">
          ${params.body}
        </td></tr>
        ${cta}
        <tr><td style="padding:16px 24px 24px 24px;border-top:1px solid #e6e2d3;
                       font-size:12px;color:${MUTED};line-height:1.5;">
          <p style="margin:0 0 6px 0;">
            ${escapeHtml(siteShortName)} · Paris &amp; Sulphur Springs, TX
          </p>
          <p style="margin:0;">
            Paris office: <a href="tel:+19037855551" style="color:${PRIMARY};">903-785-5551</a> ·
            The Rub Club: <a href="tel:+19037399959" style="color:${PRIMARY};">903-739-9959</a> ·
            Sulphur Springs: <a href="tel:+19039195020" style="color:${PRIMARY};">903-919-5020</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function detailsTable(ctx: BookingEmailContext): string {
  const loc = LOCATIONS[ctx.locationId];
  const rows: [string, string][] = [
    ["When", formatChicagoDateTimeLong(ctx.start)],
    ["Service", `${ctx.serviceLine === "massage" ? "Massage therapy" : "Chiropractic"} · ${ctx.durationMin} min`],
    ["Provider", ctx.providerDisplayName || "First available"],
    ["Location", `${loc.shortName} — ${loc.streetAddress}`],
  ];
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="margin-top:12px;border:1px solid #e6e2d3;border-radius:6px;">
    ${rows
      .map(
        ([k, v]) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;
                   font-size:13px;color:${MUTED};text-transform:uppercase;
                   letter-spacing:1px;font-weight:700;width:120px;">${escapeHtml(k)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;
                   font-size:15px;color:${TEXT};font-weight:600;">${escapeHtml(v)}</td>
      </tr>`,
      )
      .join("")}
  </table>`;
}

/**
 * Patient email sent when an appointment request is first received.
 * No calendar invite yet — only after the office accepts.
 */
export function patientPendingEmail(ctx: BookingEmailContext): {
  subject: string;
  text: string;
  html: string;
} {
  const loc = LOCATIONS[ctx.locationId];
  const subject = `Request received — ${formatChicagoDateTimeShort(ctx.start)}`;

  const text = [
    `Hi ${ctx.name.split(" ")[0] || ctx.name},`,
    "",
    "Thanks — we got your appointment request. The office will review it and email you again as soon as it is confirmed.",
    "",
    `Requested time: ${formatChicagoDateTimeLong(ctx.start)}`,
    `Service: ${ctx.serviceLine === "massage" ? "Massage therapy" : "Chiropractic"} (${ctx.durationMin} min)`,
    `Provider: ${ctx.providerDisplayName || "First available"}`,
    `Location: ${loc.name} — ${loc.addressLines.join(", ")}`,
    "",
    "Status: PENDING — we have not yet confirmed this appointment.",
    "",
    `Need to change or cancel? Call ${loc.phonePrimary}${loc.phoneSecondary ? ` (massage desk ${loc.phoneSecondary})` : ""}.`,
    "",
    `Reference: ${ctx.bookingId}`,
  ].join("\n");

  const prefNote =
    ctx.providerMode === "any" && ctx.preferredProviderName
      ? `<p style="margin:8px 0 0 0;font-size:14px;color:${MUTED};">Provider preference noted: <strong>${escapeHtml(ctx.preferredProviderName)}</strong> (final assignment by the office).</p>`
      : "";

  const body = `
    <p style="margin:0;">Hi ${escapeHtml(ctx.name.split(" ")[0] || ctx.name)},</p>
    <p style="margin:12px 0 0 0;">Thanks — we received your appointment request. The office will review it and email you again as soon as it is confirmed. You do not need to do anything else right now.</p>
    <p style="margin:12px 0 0 0;padding:10px 12px;background:#fdf6e0;border:1px solid #f2d25d;border-radius:6px;font-size:14px;font-weight:700;color:${TEXT};">
      Status: PENDING — we have not yet confirmed this appointment.
    </p>
    ${detailsTable(ctx)}
    ${prefNote}
    <p style="margin:16px 0 0 0;font-size:14px;">
      Need to change or cancel? Call
      <a href="tel:+1${loc.phonePrimary.replace(/-/g, "")}" style="color:${PRIMARY};font-weight:700;">${escapeHtml(loc.phonePrimary)}</a>${
        loc.phoneSecondary
          ? ` (massage desk <a href="tel:+1${loc.phoneSecondary.replace(/-/g, "")}" style="color:${PRIMARY};font-weight:700;">${escapeHtml(loc.phoneSecondary)}</a>)`
          : ""
      }.
    </p>
    <p style="margin:16px 0 0 0;font-size:12px;color:${MUTED};">Reference: ${escapeHtml(ctx.bookingId)}</p>
  `;

  const html = brandedShell({
    preheader: `Your ${ctx.durationMin}-minute ${ctx.serviceLine} request for ${formatChicagoDateTimeShort(ctx.start)}.`,
    heading: "We received your appointment request",
    body,
  });

  return { subject, text, html };
}

/**
 * Patient email sent once the office has accepted the request.
 * This is the "real" confirmation — pair it with the ICS attachment.
 */
export function patientAcceptedEmail(ctx: BookingEmailContext): {
  subject: string;
  text: string;
  html: string;
} {
  const loc = LOCATIONS[ctx.locationId];
  const subject = `Appointment confirmed — ${formatChicagoDateTimeShort(ctx.start)}`;

  const text = [
    `Hi ${ctx.name.split(" ")[0] || ctx.name},`,
    "",
    "Good news — your appointment has been confirmed.",
    "",
    `When: ${formatChicagoDateTimeLong(ctx.start)}`,
    `Service: ${ctx.serviceLine === "massage" ? "Massage therapy" : "Chiropractic"} (${ctx.durationMin} min)`,
    `Provider: ${ctx.providerDisplayName || "First available"}`,
    `Location: ${loc.name} — ${loc.addressLines.join(", ")}`,
    "",
    "Before your visit:",
    "• Arrive 10–15 minutes early for paperwork on a first visit (5 minutes for returning patients).",
    "• Bring photo ID and your insurance card if you have one.",
    "• Comfortable clothing is fine for both massage and chiropractic.",
    "",
    `To reschedule or cancel: call ${loc.phonePrimary}${loc.phoneSecondary ? ` (massage desk ${loc.phoneSecondary})` : ""}.`,
    "",
    `Reference: ${ctx.bookingId}`,
  ].join("\n");

  const prefNote =
    ctx.providerMode === "any" && ctx.preferredProviderName
      ? `<p style="margin:8px 0 0 0;font-size:14px;color:${MUTED};">Provider preference noted: <strong>${escapeHtml(ctx.preferredProviderName)}</strong>.</p>`
      : "";

  const body = `
    <p style="margin:0;">Hi ${escapeHtml(ctx.name.split(" ")[0] || ctx.name)},</p>
    <p style="margin:12px 0 0 0;">Good news — your appointment has been confirmed. We've attached a calendar invite (.ics) to add it to your calendar.</p>
    ${detailsTable(ctx)}
    ${prefNote}
    <h2 style="margin:20px 0 6px 0;font-size:16px;color:${TEXT};">Before your visit</h2>
    <ul style="margin:0;padding-left:18px;color:${TEXT};font-size:14px;line-height:1.6;">
      <li>Arrive 10–15 minutes early for paperwork on a first visit (5 minutes for returning patients).</li>
      <li>Bring photo ID and your insurance card if you have one.</li>
      <li>Comfortable clothing is fine for massage and chiropractic appointments.</li>
    </ul>
    <p style="margin:16px 0 0 0;font-size:14px;">
      Need to reschedule or cancel? Call
      <a href="tel:+1${loc.phonePrimary.replace(/-/g, "")}" style="color:${PRIMARY};font-weight:700;">${escapeHtml(loc.phonePrimary)}</a>${
        loc.phoneSecondary
          ? ` (massage desk <a href="tel:+1${loc.phoneSecondary.replace(/-/g, "")}" style="color:${PRIMARY};font-weight:700;">${escapeHtml(loc.phoneSecondary)}</a>)`
          : ""
      }.
    </p>
    <p style="margin:16px 0 0 0;font-size:12px;color:${MUTED};">Reference: ${escapeHtml(ctx.bookingId)}</p>
  `;

  const html = brandedShell({
    preheader: `Confirmed: ${ctx.durationMin}-minute ${ctx.serviceLine} on ${formatChicagoDateTimeShort(ctx.start)}.`,
    heading: "Your appointment is confirmed",
    body,
    ctaText: "View location and map",
    ctaHref: loc.mapsUrl,
  });

  return { subject, text, html };
}

/**
 * Patient email sent when the office declines a pending request (slot freed).
 */
export function patientDeclinedEmail(
  ctx: BookingEmailContext,
  reason?: string,
): { subject: string; text: string; html: string } {
  const loc = LOCATIONS[ctx.locationId];
  const subject = `Unable to confirm — ${formatChicagoDateTimeShort(ctx.start)}`;

  const cleanReason = (reason ?? "").trim();

  const text = [
    `Hi ${ctx.name.split(" ")[0] || ctx.name},`,
    "",
    "We're sorry — we weren't able to confirm the appointment you requested.",
    "",
    `Requested time: ${formatChicagoDateTimeLong(ctx.start)}`,
    `Service: ${ctx.serviceLine === "massage" ? "Massage therapy" : "Chiropractic"} (${ctx.durationMin} min)`,
    `Location: ${loc.name}`,
    "",
    cleanReason ? `Reason from the office: ${cleanReason}` : "",
    cleanReason ? "" : "",
    `We'd love to fit you in another time. Pick a new time at ${siteUrl("/book")} or call ${loc.phonePrimary}${loc.phoneSecondary ? ` (massage desk ${loc.phoneSecondary})` : ""}.`,
    "",
    `Reference: ${ctx.bookingId}`,
  ]
    .filter((s) => s !== "")
    .join("\n");

  const reasonBlock = cleanReason
    ? `<p style="margin:12px 0 0 0;padding:10px 12px;background:#f4f4f5;border:1px solid #d4d4d8;border-radius:6px;font-size:14px;color:${TEXT};">
        <strong>Reason from the office:</strong> ${escapeHtml(cleanReason)}
      </p>`
    : "";

  const body = `
    <p style="margin:0;">Hi ${escapeHtml(ctx.name.split(" ")[0] || ctx.name)},</p>
    <p style="margin:12px 0 0 0;">We're sorry — we weren't able to confirm the appointment you requested. The time slot is now released and no charges have been made.</p>
    ${detailsTable(ctx)}
    ${reasonBlock}
    <p style="margin:16px 0 0 0;font-size:14px;">
      We'd love to fit you in another time. Pick a new time online or call the office:
      <a href="tel:+1${loc.phonePrimary.replace(/-/g, "")}" style="color:${PRIMARY};font-weight:700;">${escapeHtml(loc.phonePrimary)}</a>${
        loc.phoneSecondary
          ? ` (massage desk <a href="tel:+1${loc.phoneSecondary.replace(/-/g, "")}" style="color:${PRIMARY};font-weight:700;">${escapeHtml(loc.phoneSecondary)}</a>)`
          : ""
      }.
    </p>
    <p style="margin:16px 0 0 0;font-size:12px;color:${MUTED};">Reference: ${escapeHtml(ctx.bookingId)}</p>
  `;

  const html = brandedShell({
    preheader: `We could not confirm your ${formatChicagoDateTimeShort(ctx.start)} request.`,
    heading: "We couldn't confirm your appointment",
    body,
    ctaText: "Pick another time",
    ctaHref: siteUrl("/book"),
  });

  return { subject, text, html };
}

/**
 * Patient email sent when the office cancels an already-confirmed appointment.
 */
export function patientCancelledEmail(
  ctx: BookingEmailContext,
  reason?: string,
): { subject: string; text: string; html: string } {
  const loc = LOCATIONS[ctx.locationId];
  const subject = `Appointment cancelled — ${formatChicagoDateTimeShort(ctx.start)}`;

  const cleanReason = (reason ?? "").trim();

  const text = [
    `Hi ${ctx.name.split(" ")[0] || ctx.name},`,
    "",
    "We're writing to let you know your appointment has been cancelled by the office.",
    "",
    `When (cancelled): ${formatChicagoDateTimeLong(ctx.start)}`,
    `Service: ${ctx.serviceLine === "massage" ? "Massage therapy" : "Chiropractic"} (${ctx.durationMin} min)`,
    `Provider: ${ctx.providerDisplayName || "First available"}`,
    `Location: ${loc.name}`,
    "",
    cleanReason ? `Reason from the office: ${cleanReason}` : "",
    cleanReason ? "" : "",
    `To rebook: ${siteUrl("/book")} or call ${loc.phonePrimary}${loc.phoneSecondary ? ` (massage desk ${loc.phoneSecondary})` : ""}.`,
    "",
    `Reference: ${ctx.bookingId}`,
  ]
    .filter((s) => s !== "")
    .join("\n");

  const reasonBlock = cleanReason
    ? `<p style="margin:12px 0 0 0;padding:10px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;font-size:14px;color:${TEXT};">
        <strong>Reason from the office:</strong> ${escapeHtml(cleanReason)}
      </p>`
    : "";

  const body = `
    <p style="margin:0;">Hi ${escapeHtml(ctx.name.split(" ")[0] || ctx.name)},</p>
    <p style="margin:12px 0 0 0;">Your appointment has been cancelled by the office. The time slot is now released.</p>
    ${detailsTable(ctx)}
    ${reasonBlock}
    <p style="margin:16px 0 0 0;font-size:14px;">
      We'd love to rebook you. Pick a new time online or call the office:
      <a href="tel:+1${loc.phonePrimary.replace(/-/g, "")}" style="color:${PRIMARY};font-weight:700;">${escapeHtml(loc.phonePrimary)}</a>${
        loc.phoneSecondary
          ? ` (massage desk <a href="tel:+1${loc.phoneSecondary.replace(/-/g, "")}" style="color:${PRIMARY};font-weight:700;">${escapeHtml(loc.phoneSecondary)}</a>)`
          : ""
      }.
    </p>
    <p style="margin:16px 0 0 0;font-size:12px;color:${MUTED};">Reference: ${escapeHtml(ctx.bookingId)}</p>
  `;

  const html = brandedShell({
    preheader: `Your ${formatChicagoDateTimeShort(ctx.start)} appointment was cancelled by the office.`,
    heading: "Your appointment was cancelled",
    body,
    ctaText: "Pick another time",
    ctaHref: siteUrl("/book"),
  });

  return { subject, text, html };
}

/**
 * @deprecated Use `patientPendingEmail` (new request) or `patientAcceptedEmail`
 * (after the office confirms). Kept as a thin alias to avoid breaking older imports.
 */
export const patientConfirmationEmail = patientPendingEmail;

/** Office-facing rich HTML notification. */
export function officeNotificationEmail(ctx: BookingEmailContext): {
  subject: string;
  text: string;
  html: string;
} {
  const loc = LOCATIONS[ctx.locationId];
  const subject = `New booking: ${ctx.serviceLine} @ ${formatChicagoDateTimeShort(ctx.start)}`;

  const prefLine =
    ctx.providerMode === "any" && ctx.preferredProviderName
      ? `Client preference noted: ${ctx.preferredProviderName} (assignment may differ).`
      : ctx.providerMode === "specific"
        ? "Client requested a specific provider."
        : "Client requested first available.";

  const text = [
    "NEW ONLINE BOOKING REQUEST",
    "",
    `Reference: ${ctx.bookingId}`,
    `When (Chicago): ${formatChicagoDateTimeLong(ctx.start)}`,
    `Service: ${ctx.serviceLine} (${ctx.durationMin} min)`,
    `Location: ${loc.name}`,
    `Provider: ${ctx.providerDisplayName || "First available"}`,
    `Mode: ${ctx.providerMode}`,
    prefLine,
    "",
    `Name: ${ctx.name}`,
    `Phone: ${ctx.phone}`,
    `Email: ${ctx.email}`,
    ctx.notes ? `Notes: ${ctx.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const adminFocusUrl = siteUrl(`/admin?focus=${encodeURIComponent(ctx.bookingId)}`);

  const body = `
    <p style="margin:0;font-weight:700;">New appointment request submitted on ${escapeHtml(siteShortName)}.</p>
    <p style="margin:12px 0 0 0;padding:12px 14px;background:#fdf6e0;border:1px solid #f2d25d;border-radius:6px;font-size:14px;color:${TEXT};">
      <strong>Action needed:</strong> Accept or decline this request in the admin portal.
      <br>
      <a href="${escapeHtml(adminFocusUrl)}" style="display:inline-block;margin-top:6px;color:${PRIMARY};font-weight:700;">Open this booking in /admin →</a>
    </p>
    ${detailsTable(ctx)}
    <h2 style="margin:20px 0 6px 0;font-size:16px;color:${TEXT};">Patient</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #e6e2d3;border-radius:6px;">
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;font-size:13px;color:${MUTED};
                   text-transform:uppercase;letter-spacing:1px;font-weight:700;width:120px;">Name</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;font-size:15px;font-weight:600;">
          ${escapeHtml(ctx.name)}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;font-size:13px;color:${MUTED};
                   text-transform:uppercase;letter-spacing:1px;font-weight:700;">Phone</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;font-size:15px;font-weight:600;">
          <a href="tel:${escapeHtml(ctx.phone.replace(/[^\d+]/g, ""))}" style="color:${PRIMARY};">${escapeHtml(ctx.phone)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;font-size:13px;color:${MUTED};
                   text-transform:uppercase;letter-spacing:1px;font-weight:700;">Email</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;font-size:15px;font-weight:600;">
          <a href="mailto:${escapeHtml(ctx.email)}" style="color:${PRIMARY};">${escapeHtml(ctx.email)}</a>
        </td>
      </tr>
      ${
        ctx.notes
          ? `<tr>
        <td style="padding:10px 12px;font-size:13px;color:${MUTED};
                   text-transform:uppercase;letter-spacing:1px;font-weight:700;">Notes</td>
        <td style="padding:10px 12px;font-size:14px;">${escapeHtml(ctx.notes)}</td>
      </tr>`
          : ""
      }
    </table>
    <p style="margin:16px 0 0 0;font-size:13px;color:${MUTED};">${escapeHtml(prefLine)}</p>
    <p style="margin:6px 0 0 0;font-size:12px;color:${MUTED};">Reference: ${escapeHtml(ctx.bookingId)}</p>
  `;

  const html = brandedShell({
    preheader: `${ctx.name} requested ${ctx.serviceLine} on ${formatChicagoDateTimeShort(ctx.start)}.`,
    heading: "New booking request",
    body,
    ctaText: "Open admin dashboard",
    ctaHref: siteUrl("/admin"),
  });

  return { subject, text, html };
}

/** Generic contact form notification. */
export function contactFormEmail(params: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  topic?: string;
}): { subject: string; text: string; html: string } {
  const subject = params.subject ?? `Contact form: ${params.topic ?? "General inquiry"}`;
  const text = [
    `New contact form submission`,
    `Topic: ${params.topic ?? "General"}`,
    `Name: ${params.name}`,
    `Email: ${params.email}`,
    params.phone ? `Phone: ${params.phone}` : "",
    "",
    "Message:",
    params.message,
  ]
    .filter(Boolean)
    .join("\n");

  const body = `
    <p style="margin:0;">A visitor submitted the contact form.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin-top:12px;border:1px solid #e6e2d3;border-radius:6px;">
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;width:120px;font-size:13px;
                   color:${MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">Topic</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;font-weight:600;">
          ${escapeHtml(params.topic ?? "General")}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;font-size:13px;color:${MUTED};
                   font-weight:700;text-transform:uppercase;letter-spacing:1px;">Name</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;font-weight:600;">${escapeHtml(params.name)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;font-size:13px;color:${MUTED};
                   font-weight:700;text-transform:uppercase;letter-spacing:1px;">Email</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;">
          <a href="mailto:${escapeHtml(params.email)}" style="color:${PRIMARY};font-weight:600;">${escapeHtml(params.email)}</a>
        </td>
      </tr>
      ${
        params.phone
          ? `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;font-size:13px;color:${MUTED};
                   font-weight:700;text-transform:uppercase;letter-spacing:1px;">Phone</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ecdd;">
          <a href="tel:${escapeHtml(params.phone.replace(/[^\d+]/g, ""))}" style="color:${PRIMARY};font-weight:600;">${escapeHtml(params.phone)}</a>
        </td>
      </tr>`
          : ""
      }
    </table>
    <h2 style="margin:18px 0 6px 0;font-size:16px;color:${TEXT};">Message</h2>
    <p style="margin:0;white-space:pre-line;">${escapeHtml(params.message)}</p>
  `;
  const html = brandedShell({
    preheader: `${params.name} sent a contact form message.`,
    heading: "New contact form submission",
    body,
  });
  return { subject, text, html };
}
