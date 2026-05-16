import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { recordBookingEvent } from "@/lib/booking-events";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientPaymentRequestEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { sendSms } from "@/lib/twilio";
import { createPaymentLink } from "@/lib/square";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    amountCents?: number;
    description?: string;
  } | null;

  if (!body?.amountCents || typeof body.amountCents !== "number" || body.amountCents < 50) {
    return NextResponse.json(
      { error: "amountCents is required and must be at least 50 ($0.50)." },
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

  const status = snap.get("status");
  if (status !== "confirmed") {
    return NextResponse.json(
      { error: "Payments can only be requested for confirmed appointments." },
      { status: 409 },
    );
  }

  const emailCtx = bookingDocToEmailContext(snap);
  if (!emailCtx) {
    return NextResponse.json(
      { error: "Booking is missing required fields for payment." },
      { status: 422 },
    );
  }

  const linkResult = await createPaymentLink({
    amountCents: body.amountCents,
    patientName: emailCtx.name,
    bookingId: id,
    description: body.description,
  });

  if (!linkResult.created) {
    return NextResponse.json(
      { error: `Could not create payment link: ${linkResult.detail ?? linkResult.reason}` },
      { status: 502 },
    );
  }

  await bookingRef.update({
    paymentLinkUrl: linkResult.url,
    paymentLinkId: linkResult.paymentLinkId,
    paymentAmountCents: body.amountCents,
    paymentDescription: body.description ?? null,
    paymentRequestedAt: FieldValue.serverTimestamp(),
    paymentRequestedByUid: staff.uid,
  });

  let emailSent = false;
  let smsSent = false;

  try {
    const { subject, text, html } = patientPaymentRequestEmail(emailCtx, {
      amountCents: body.amountCents,
      paymentUrl: linkResult.url,
      description: body.description,
    });
    await sendBookingNotification({
      to: emailCtx.email,
      subject,
      text,
      html,
      fromName: "The Rub Club & Chiropractic Associates",
    });
    emailSent = true;
  } catch (err) {
    console.error("Payment request email failed:", err);
  }

  if (emailCtx.phone) {
    const dollars = (body.amountCents / 100).toFixed(2);
    const smsBody = `Payment request: $${dollars} for your appointment. Pay online: ${linkResult.url}`;
    const result = await sendSms(emailCtx.phone, smsBody);
    smsSent = result.sent;
  }

  await recordBookingEvent(db, id, {
    type: "payment_requested",
    byUid: staff.uid,
    byEmail: staff.email ?? null,
    meta: {
      amountCents: body.amountCents,
      paymentLinkUrl: linkResult.url,
      paymentLinkId: linkResult.paymentLinkId,
      emailSent,
      smsSent,
    },
  }).catch((err) => console.error("Failed to log payment event:", err));

  return NextResponse.json({
    ok: true,
    paymentUrl: linkResult.url,
    emailSent,
    smsSent,
  });
}
