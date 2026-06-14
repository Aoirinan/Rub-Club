/**
 * Optional office notification when a new online form is submitted.
 *
 * HARD RULE: this email must never contain PHI. We send only the form title and
 * an opaque deep link to the staff-only admin detail view — no answers, names,
 * or field values. Gated behind `notifyEmails` being non-empty.
 */

import { sendOutboundEmail } from "@/lib/sendgrid";
import { getPublicAppOrigin } from "@/lib/app-origin";

export async function notifyNewSubmission(params: {
  formTitle: string;
  submissionId: string;
  notifyEmails: string[];
  formSlug?: string;
}): Promise<void> {
  const recipients = params.notifyEmails.map((e) => e.trim()).filter(Boolean);
  if (recipients.length === 0) return;

  const origin = getPublicAppOrigin();
  const link = `${origin}/admin/super/online-forms`;
  const subject = `New ${params.formTitle} submission`;
  const text =
    `A new "${params.formTitle}" form was submitted.\n\n` +
    `Review it in the staff admin (sign-in required):\n${link}\n\n` +
    `For privacy, no patient details are included in this email.`;
  const html =
    `<p>A new "<strong>${escapeHtml(params.formTitle)}</strong>" form was submitted.</p>` +
    `<p>Review it in the staff admin (sign-in required):<br/>` +
    `<a href="${link}">${link}</a></p>` +
    `<p style="color:#666;font-size:12px">For privacy, no patient details are included in this email.</p>`;

  for (const to of recipients) {
    try {
      const res = await sendOutboundEmail({ to, subject, text, html });
      if (!res.ok) {
        console.warn("[online-forms] notification not sent:", res.reason);
      }
    } catch (err) {
      console.error("[online-forms] notification error", err);
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
