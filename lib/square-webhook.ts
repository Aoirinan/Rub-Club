/**
 * Pure helpers for the Square payment webhook (app/api/webhooks/square).
 *
 * Square has no `payment.completed` event: a payment emits `payment.created`
 * and then one or more `payment.updated` events as its status moves through
 * APPROVED / PENDING / COMPLETED / CANCELED / FAILED. We only act once the
 * payment itself says COMPLETED; the route's transaction de-duplicates the
 * several events Square may send for the same payment id.
 */

export const SQUARE_PAYMENT_EVENT_TYPES = ["payment.created", "payment.updated"] as const;

export type SquarePaymentWebhookPayload = {
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

export type SquarePaymentDecision =
  | { accept: true; squarePaymentId: string; amountCents: number; bookingId: string }
  | {
      accept: false;
      reason: "event_type" | "no_payment_id" | "not_completed" | "no_booking_id";
      squarePaymentId?: string;
    };

/**
 * Extract a booking ID from the payment note.
 * lib/square.ts createPaymentLink sets the note as "Booking {bookingId} — {patientName}".
 */
export function extractBookingIdFromPaymentNote(note?: string): string | null {
  if (!note) return null;
  const m1 = note.match(/^Booking\s+(\S+)/);
  if (m1) return m1[1] ?? null;
  const m2 = note.match(/bookingId=([^&\s]+)/i);
  if (m2) return m2[1] ?? null;
  return null;
}

/** Decide whether a verified Square webhook payload should record a booking payment. */
export function decideSquarePaymentEvent(
  payload: SquarePaymentWebhookPayload,
): SquarePaymentDecision {
  const type = payload.type ?? "";
  if (!(SQUARE_PAYMENT_EVENT_TYPES as readonly string[]).includes(type)) {
    return { accept: false, reason: "event_type" };
  }

  const payment = payload.data?.object?.payment;
  const squarePaymentId = payment?.id;
  if (!payment || typeof squarePaymentId !== "string" || !squarePaymentId) {
    return { accept: false, reason: "no_payment_id" };
  }

  if (payment.status !== "COMPLETED") {
    return { accept: false, reason: "not_completed", squarePaymentId };
  }

  const bookingId = extractBookingIdFromPaymentNote(payment.note);
  if (!bookingId) {
    return { accept: false, reason: "no_booking_id", squarePaymentId };
  }

  const amount = Number(payment.amount_money?.amount ?? 0);
  return {
    accept: true,
    squarePaymentId,
    amountCents: Number.isFinite(amount) ? amount : 0,
    bookingId,
  };
}
