import { describe, expect, it } from "vitest";
import {
  decideSquarePaymentEvent,
  extractBookingIdFromPaymentNote,
  type SquarePaymentWebhookPayload,
} from "./square-webhook";

function event(
  type: string,
  payment: NonNullable<NonNullable<SquarePaymentWebhookPayload["data"]>["object"]>["payment"],
): SquarePaymentWebhookPayload {
  return { type, data: { object: { payment } } };
}

const completed = {
  id: "pay_123",
  status: "COMPLETED",
  amount_money: { amount: 6500, currency: "USD" },
  note: "Booking abc123 — Jane Doe",
};

describe("decideSquarePaymentEvent", () => {
  it("accepts a COMPLETED payment on payment.updated", () => {
    expect(decideSquarePaymentEvent(event("payment.updated", completed))).toEqual({
      accept: true,
      squarePaymentId: "pay_123",
      amountCents: 6500,
      bookingId: "abc123",
    });
  });

  it("accepts a COMPLETED payment on payment.created", () => {
    const d = decideSquarePaymentEvent(event("payment.created", completed));
    expect(d.accept).toBe(true);
  });

  it("ignores the non-existent payment.completed type and unrelated events", () => {
    expect(decideSquarePaymentEvent(event("payment.completed", completed))).toMatchObject({
      accept: false,
      reason: "event_type",
    });
    expect(decideSquarePaymentEvent(event("refund.updated", completed))).toMatchObject({
      accept: false,
      reason: "event_type",
    });
    expect(decideSquarePaymentEvent({})).toMatchObject({ accept: false, reason: "event_type" });
  });

  it.each(["APPROVED", "PENDING", "CANCELED", "FAILED", undefined])(
    "skips a payment with status %s",
    (status) => {
      expect(
        decideSquarePaymentEvent(event("payment.updated", { ...completed, status })),
      ).toMatchObject({ accept: false, reason: "not_completed", squarePaymentId: "pay_123" });
    },
  );

  it("skips events without a payment id", () => {
    expect(
      decideSquarePaymentEvent(event("payment.updated", { ...completed, id: undefined })),
    ).toMatchObject({ accept: false, reason: "no_payment_id" });
    expect(decideSquarePaymentEvent({ type: "payment.updated" })).toMatchObject({
      accept: false,
      reason: "no_payment_id",
    });
  });

  it("skips a completed payment whose note names no booking", () => {
    expect(
      decideSquarePaymentEvent(event("payment.updated", { ...completed, note: "Walk-in" })),
    ).toMatchObject({ accept: false, reason: "no_booking_id" });
  });

  it("treats a missing amount as zero", () => {
    const d = decideSquarePaymentEvent(
      event("payment.updated", { ...completed, amount_money: undefined }),
    );
    expect(d).toMatchObject({ accept: true, amountCents: 0 });
  });
});

describe("extractBookingIdFromPaymentNote", () => {
  it("reads the charge-route note format", () => {
    expect(extractBookingIdFromPaymentNote("Booking XyZ9 — Pat Smith")).toBe("XyZ9");
  });
  it("reads a bookingId= parameter", () => {
    expect(extractBookingIdFromPaymentNote("ref bookingId=abc&x=1")).toBe("abc");
  });
  it("returns null when absent", () => {
    expect(extractBookingIdFromPaymentNote(undefined)).toBeNull();
    expect(extractBookingIdFromPaymentNote("Thanks!")).toBeNull();
  });
});
