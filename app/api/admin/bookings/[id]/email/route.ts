import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { recordBookingEvent } from "@/lib/booking-events";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientCustomEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    subject?: string;
    message?: string;
  } | null;

  if (!body?.subject?.trim() || !body?.message?.trim()) {
    return NextResponse.json(
      { error: "Both subject and message are required." },
      { status: 400 },
    );
  }

  const { id } = await ctx.params;
  const db = getFirestore();
  const bookingRef = db.collection("bookings").doc(id);
  const snap = await bookingRef.get();

  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const emailCtx = bookingDocToEmailContext(snap);
  if (!emailCtx) {
    return NextResponse.json(
      { error: "Booking is missing required fields for email." },
      { status: 422 },
    );
  }

  try {
    const { subject, text, html } = patientCustomEmail(emailCtx, {
      subject: body.subject.trim(),
      message: body.message.trim(),
    });
    await sendBookingNotification({
      to: emailCtx.email,
      subject,
      text,
      html,
      fromName: "The Rub Club & Chiropractic Associates",
    });
  } catch (err) {
    console.error("Custom email failed:", err);
    return NextResponse.json({ error: "Failed to send email." }, { status: 502 });
  }

  await recordBookingEvent(db, id, {
    type: "custom_email",
    byUid: staff.uid,
    byEmail: staff.email ?? null,
    meta: { subject: body.subject.trim() },
  }).catch((err) => console.error("Failed to log custom email event:", err));

  return NextResponse.json({ ok: true });
}
