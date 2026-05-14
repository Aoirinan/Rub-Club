import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { recordBookingEvent } from "@/lib/booking-events";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import {
  patientAcceptedEmail,
  patientPaymentReceiptEmail,
} from "@/lib/email-templates";
import { buildIcs } from "@/lib/ics";
import { generatePatientPortalToken, hashPatientPortalToken } from "@/lib/patient-portal-token";
import { sendBookingNotification } from "@/lib/sendgrid";
import { siteUrl } from "@/lib/site-content";
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

  const existingPayId = snap.get("squarePaymentId");
  if (typeof existingPayId === "string" && existingPayId.length > 0) {
    if (existingPayId === squarePaymentId) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    console.warn("[square-webhook] Booking already linked to a different payment; ignoring.", bookingId);
    return NextResponse.json({ ok: true, skipped: true });
  }

  const prepaidOnline = snap.get("prepaidOnline") === true;
  const bookingStatus = snap.get("status");
  const autoConfirm = prepaidOnline && bookingStatus === "pending";
  let portalPlain: string | null = null;
  let portalHash: string | null = null;
  if (autoConfirm) {
    portalPlain = generatePatientPortalToken();
    portalHash = hashPatientPortalToken(portalPlain);
  }

  const paymentUpdate: Record<string, unknown> = {
    paidAt: FieldValue.serverTimestamp(),
    paidAmountCents: amountCents,
    squarePaymentId,
  };
  if (autoConfirm && portalHash) {
    paymentUpdate.status = "confirmed";
    paymentUpdate.acceptedAt = FieldValue.serverTimestamp();
    paymentUpdate.acceptedByUid = null;
    paymentUpdate.acceptedByEmail = "square_prepay";
    paymentUpdate.patientPortalTokenHash = portalHash;
  }

  await bookingRef.update(paymentUpdate);

  await recordBookingEvent(db, bookingId, {
    type: "payment_completed",
    byUid: null,
    byEmail: null,
    meta: { amountCents, squarePaymentId },
  }).catch((err) => console.error("Failed to log payment_completed event:", err));

  if (autoConfirm && portalHash) {
    await recordBookingEvent(db, bookingId, {
      type: "accepted",
      byUid: null,
      byEmail: "square_prepay",
      meta: { prevStatus: "pending", via: "square_prepay" },
    }).catch((err) => console.error("Failed to log accepted event:", err));
  }

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

  if (autoConfirm && portalPlain) {
    try {
      const fresh = await bookingRef.get();
      const emailCtx = bookingDocToEmailContext(fresh);
      if (emailCtx) {
        const manageUrl = siteUrl(`/book/manage?token=${encodeURIComponent(portalPlain)}`);
        const ics = buildIcs({
          uid: `${emailCtx.bookingId}@wellnessparistx`,
          startUtc: emailCtx.start.toUTC(),
          durationMinutes: emailCtx.durationMin,
          summary: `${emailCtx.serviceLine === "massage" ? "Massage" : "Chiropractic"} appointment`,
          description: `Confirmed appointment with ${emailCtx.providerDisplayName || "first available provider"}. Reference: ${emailCtx.bookingId}.`,
          location: `${emailCtx.locationId === "paris" ? "Paris" : "Sulphur Springs"}, TX`,
          organizerEmail: process.env.OFFICE_NOTIFICATION_EMAIL,
          organizerName: "Paris Wellness",
        });
        const icsBase64 = Buffer.from(ics, "utf8").toString("base64");
        const { subject, text, html } = patientAcceptedEmail({
          ...emailCtx,
          patientManageUrl: manageUrl,
        });
        await sendBookingNotification({
          to: emailCtx.email,
          subject,
          text,
          html,
          fromName: "The Rub Club & Chiropractic Associates",
          attachments: [
            {
              filename: "appointment.ics",
              content: icsBase64,
              type: "text/calendar; method=PUBLISH",
            },
          ],
        });
      }
    } catch (err) {
      console.error("Square prepay acceptance email failed:", err);
    }
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
