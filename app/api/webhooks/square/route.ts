import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { recordBookingEvent } from "@/lib/booking-events";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientPaymentReceiptEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { verifySquareWebhook } from "@/lib/square";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature") ?? "";
  const notificationUrl = req.url;

  if (!verifySquareWebhook(rawBody, signature, notificationUrl)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    type?: string;
    data?: {
      object?: {
        payment?: {
          id?: string;
          amount_money?: { amount?: number; currency?: string };
          note?: string;
          status?: string;
          order_id?: string;
        };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.type !== "payment.completed") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const payment = payload.data?.object?.payment;
  if (!payment?.id) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const amountCents = Number(payment.amount_money?.amount ?? 0);
  const squarePaymentId = payment.id;

  const bookingId = extractBookingId(payment.note);
  if (!bookingId) {
    console.warn("[square-webhook] Could not extract bookingId from payment note:", payment.note);
    return NextResponse.json({ ok: true, skipped: true });
  }

  const db = getFirestore();
  const bookingRef = db.collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();

  if (!snap.exists) {
    console.warn("[square-webhook] Booking not found:", bookingId);
    return NextResponse.json({ ok: true, skipped: true });
  }

  await bookingRef.update({
    paidAt: FieldValue.serverTimestamp(),
    paidAmountCents: amountCents,
    squarePaymentId,
  });

  await recordBookingEvent(db, bookingId, {
    type: "payment_completed",
    byUid: null,
    byEmail: null,
    meta: { amountCents, squarePaymentId },
  }).catch((err) => console.error("Failed to log payment_completed event:", err));

  try {
    const emailCtx = bookingDocToEmailContext(snap);
    if (emailCtx) {
      const { subject, text, html } = patientPaymentReceiptEmail(emailCtx, {
        amountCents,
        squarePaymentId,
      });
      await sendBookingNotification({
        to: emailCtx.email,
        subject,
        text,
        html,
        fromName: "The Rub Club & Chiropractic Associates",
      });
    }
  } catch (err) {
    console.error("Receipt email failed:", err);
  }

  return NextResponse.json({ ok: true });
}

/**
 * Extract a booking ID from the payment note.
 * The charge route sets note as "Booking {bookingId} — {patientName}".
 */
function extractBookingId(note?: string): string | null {
  if (!note) return null;
  const match = note.match(/^Booking\s+(\S+)/);
  return match ? match[1] : null;
}
