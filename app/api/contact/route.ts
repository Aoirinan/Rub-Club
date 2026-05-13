import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRateLimitOk } from "@/lib/rate-limit";
import { sendBookingNotification } from "@/lib/sendgrid";
import { contactFormEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
  topic: z.string().max(80).optional(),
  message: z.string().min(5).max(4000),
  website: z.string().max(200).optional(),
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

  const officeTo = process.env.OFFICE_NOTIFICATION_EMAIL;
  if (!officeTo) {
    console.warn("Contact form submitted but OFFICE_NOTIFICATION_EMAIL is not set");
    return NextResponse.json(
      { ok: true, note: "Received. The office will follow up." },
      { status: 200 },
    );
  }

  try {
    const { subject, text, html } = contactFormEmail({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim(),
      topic: body.topic?.trim(),
      message: body.message.trim(),
    });
    await sendBookingNotification({
      to: officeTo,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("Contact form SendGrid failed", err);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
