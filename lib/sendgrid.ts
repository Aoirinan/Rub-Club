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
