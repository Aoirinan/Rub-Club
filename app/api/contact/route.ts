import { NextResponse } from "next/server";
import { z } from "zod";
import { contactFormAutoReplyEmail, contactFormEmail } from "@/lib/email-templates";
import {
  createContactSubmission,
  updateContactSubmissionDelivery,
} from "@/lib/contact-submissions";
import { resolveOfficeNotificationEmail } from "@/lib/contact-routing";
import { assertRateLimitOk } from "@/lib/rate-limit";
import { sendOutboundEmail } from "@/lib/sendgrid";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
  topic: z.string().max(80).optional(),
  message: z.string().min(5).max(4000),
  website: z.string().max(200).optional(),
  location: z.enum(["paris", "sulphur_springs"]).optional(),
});

export async function POST(req: Request) {
  const rl = await assertRateLimitOk(req.headers);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again soon." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const body = parsed.data;

  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const payload = {
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone?.trim(),
    topic: body.topic?.trim(),
    message: body.message.trim(),
    location: body.location,
  };

  let submissionId: string;
  try {
    submissionId = await createContactSubmission(payload);
  } catch (err) {
    console.error("Contact form Firestore save failed", err);
    return NextResponse.json(
      {
        error:
          "We could not save your message right now. Please call our Paris office at 903-785-5551.",
      },
      { status: 503 },
    );
  }

  let officeEmailSent = false;
  const officeTo = await resolveOfficeNotificationEmail(payload.location);
  if (officeTo) {
    const { subject, text, html } = contactFormEmail({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      topic: payload.topic,
      message: payload.message,
    });
    const officeResult = await sendOutboundEmail({ to: officeTo, subject, text, html });
    officeEmailSent = officeResult.ok;
    if (!officeResult.ok) {
      console.warn("[contact] office notification not sent:", officeResult.reason);
    }
  } else {
    console.warn("[contact] no office notification email configured — message saved; staff use Admin → Contact inbox");
  }

  const autoReply = contactFormAutoReplyEmail({ name: payload.name });
  const autoResult = await sendOutboundEmail({
    to: payload.email,
    subject: autoReply.subject,
    text: autoReply.text,
    html: autoReply.html,
  });
  const autoReplySent = autoResult.ok;
  if (!autoResult.ok) {
    console.warn("[contact] visitor auto-reply not sent:", autoResult.reason);
  }

  try {
    await updateContactSubmissionDelivery(submissionId, { officeEmailSent, autoReplySent });
  } catch (err) {
    console.error("Contact form delivery flags update failed", err);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
