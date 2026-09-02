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
import { linkBookingAfterCreate, onBookingStatusChange } from "@/lib/patients-db";
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

  // Read-check-write inside one transaction so a redelivered webhook cannot
  // double-confirm or mint a second portal token.
  type TxOutcome =
    | { kind: "skipped"; reason: string }
    | {
        kind: "recorded";
        autoConfirm: boolean;
        prevStatus: string | undefined;
        portalPlain: string | null;
        underpaid: boolean;
        expectedCents: number | null;
      };

  const outcome: TxOutcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef);
    if (!snap.exists) return { kind: "skipped", reason: "not_found" };

    const existingPayId = snap.get("squarePaymentId");
    if (typeof existingPayId === "string" && existingPayId.length > 0) {
      return {
        kind: "skipped",
        reason: existingPayId === squarePaymentId ? "duplicate" : "other_payment",
      };
    }

    const prepaidOnline = snap.get("prepaidOnline") === true;
    const bookingStatus = snap.get("status") as string | undefined;
    const expectedRaw = snap.get("paymentAmountCents");
    const expectedCents =
      typeof expectedRaw === "number" && Number.isFinite(expectedRaw) && expectedRaw > 0
        ? Math.round(expectedRaw)
        : null;
    // Never auto-confirm on a payment smaller than what the office asked for.
    const underpaid = expectedCents !== null && amountCents < expectedCents;
    const autoConfirm = prepaidOnline && bookingStatus === "pending" && !underpaid;

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
      ...(underpaid ? { paymentUnderpaid: true } : {}),
    };
    if (autoConfirm && portalHash) {
      paymentUpdate.status = "confirmed";
      paymentUpdate.acceptedAt = FieldValue.serverTimestamp();
      paymentUpdate.acceptedByUid = null;
      paymentUpdate.acceptedByEmail = "square_prepay";
      paymentUpdate.patientPortalTokenHash = portalHash;
    }
    tx.update(bookingRef, paymentUpdate);

    return {
      kind: "recorded",
      autoConfirm,
      prevStatus: bookingStatus,
      portalPlain,
      underpaid,
      expectedCents,
    };
  });

  if (outcome.kind === "skipped") {
    if (outcome.reason === "not_found") {
      console.warn("[square-webhook] Booking not found:", bookingId);
    } else if (outcome.reason === "other_payment") {
      console.warn("[square-webhook] Booking already linked to a different payment; ignoring.", bookingId);
    }
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { autoConfirm, prevStatus, portalPlain, underpaid, expectedCents } = outcome;
  if (underpaid) {
    console.warn("[square-webhook] Payment below requested amount; not auto-confirming.", {
      bookingId,
      amountCents,
      expectedCents,
    });
  }

  await recordBookingEvent(db, bookingId, {
    type: "payment_completed",
    byUid: null,
    byEmail: null,
    meta: {
      amountCents,
      squarePaymentId,
      ...(expectedCents !== null ? { expectedCents } : {}),
      ...(underpaid ? { underpaid: true } : {}),
    },
  }).catch((err) => console.error("Failed to log payment_completed event:", err));

  if (autoConfirm) {
    await recordBookingEvent(db, bookingId, {
      type: "accepted",
      byUid: null,
      byEmail: "square_prepay",
      meta: { prevStatus: "pending", via: "square_prepay" },
    }).catch((err) => console.error("Failed to log accepted event:", err));

    // Keep patient records in step with the manual accept route.
    try {
      let after = await bookingRef.get();
      let patientId = typeof after.get("patientId") === "string" ? after.get("patientId") : null;
      if (!patientId) {
        await linkBookingAfterCreate(db, bookingId, "online_booking");
        after = await bookingRef.get();
        patientId = typeof after.get("patientId") === "string" ? after.get("patientId") : null;
      }
      if (patientId) {
        await onBookingStatusChange(db, patientId, prevStatus, "confirmed");
      }
    } catch (err) {
      console.error("[square-webhook] patient link failed", err);
    }
  }

  const snap = await bookingRef.get();

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
          uid: `${emailCtx.bookingId}@chiropracticparistexas.com`,
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
  const m1 = note.match(/^Booking\s+(\S+)/);
  if (m1) return m1[1] ?? null;
  const m2 = note.match(/bookingId=([^&\s]+)/i);
  if (m2) return m2[1] ?? null;
  return null;
}
