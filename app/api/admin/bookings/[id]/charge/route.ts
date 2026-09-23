import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { recordBookingEvent } from "@/lib/booking-events";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientPaymentRequestEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { sendSms } from "@/lib/twilio";
import { createPaymentLink } from "@/lib/square";
import { emailLocations } from "@/lib/email-locations";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// Same amount/description limits as app/api/payments/square-link, plus the
// $0.50 minimum this route has always enforced.
const bodySchema = z.object({
  amountCents: z.number().int().min(50).max(500_000),
  description: z.string().max(200).optional(),
});

export async function POST(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "amountCents must be a whole number of cents from 50 ($0.50) to 500000 ($5,000); description is limited to 200 characters.",
      },
      { status: 400 },
    );
  }
  const body = {
    amountCents: parsed.data.amountCents,
    description: parsed.data.description?.trim() || undefined,
  };

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
    // Square's error text is logged by lib/square.ts; don't pass it to the client.
    console.error("[charge] payment link not created", { bookingId: id, reason: linkResult.reason });
    return NextResponse.json(
      { error: "Could not create payment link. Please try again later." },
      { status: linkResult.reason === "missing_env" ? 503 : 502 },
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
    const { subject, text, html } = patientPaymentRequestEmail(
      emailCtx,
      {
        amountCents: body.amountCents,
        paymentUrl: linkResult.url,
        description: body.description,
      },
      await emailLocations(),
    );
    emailSent = await sendBookingNotification({
      to: emailCtx.email,
      subject,
      text,
      html,
    });
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
