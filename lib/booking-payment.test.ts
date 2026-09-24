import { describe, expect, it } from "vitest";
import {
  bookingIsPaid,
  effectivePaymentMethod,
  formatUsdCents,
  isPaymentMethod,
  isSquareOnlinePayment,
  paidStatusLabel,
  parseOptionalDollars,
  refusePaymentChange,
} from "./booking-payment";

describe("bookingIsPaid", () => {
  it("counts a recorded payment time, even without an amount", () => {
    expect(bookingIsPaid({ paidAtMs: 1 })).toBe(true);
    expect(bookingIsPaid({ paidAtMs: 1, paidAmountCents: null })).toBe(true);
  });

  it("counts older online payments that have only an amount", () => {
    expect(bookingIsPaid({ paidAmountCents: 6500 })).toBe(true);
  });

  it("is unpaid with neither", () => {
    expect(bookingIsPaid({})).toBe(false);
    expect(bookingIsPaid({ paidAmountCents: 0 })).toBe(false);
    expect(bookingIsPaid({ paidAtMs: null, paidAmountCents: null })).toBe(false);
  });
});

describe("payment method", () => {
  it("knows desk and online methods", () => {
    for (const m of ["card", "cash", "check", "other", "square_online"]) {
      expect(isPaymentMethod(m)).toBe(true);
    }
    expect(isPaymentMethod("venmo")).toBe(false);
  });

  it("treats a legacy webhook record (Square id, no method) as online", () => {
    expect(isSquareOnlinePayment({ squarePaymentId: "sq_1" })).toBe(true);
    expect(effectivePaymentMethod({ squarePaymentId: "sq_1", paidAmountCents: 100 })).toBe(
      "square_online",
    );
  });

  it("uses the recorded method over a leftover Square id", () => {
    const b = { squarePaymentId: "sq_1", paymentMethod: "cash", paidAtMs: 1 };
    expect(isSquareOnlinePayment(b)).toBe(false);
    expect(effectivePaymentMethod(b)).toBe("cash");
  });

  it("labels paid visits", () => {
    expect(paidStatusLabel({ paidAtMs: 1, paymentMethod: "card" })).toBe("Paid · Card");
    expect(paidStatusLabel({ paidAmountCents: 100, squarePaymentId: "x" })).toBe(
      "Paid · Online (Square)",
    );
    expect(paidStatusLabel({ paidAmountCents: 100 })).toBe("Paid");
    expect(paidStatusLabel({ paymentMethod: "card" })).toBe("");
  });

  it("formats dollars", () => {
    expect(formatUsdCents(6500)).toBe("$65.00");
    expect(formatUsdCents(106_550)).toBe("$1,065.50");
  });
});

describe("parseOptionalDollars", () => {
  it("accepts blank as no amount", () => {
    expect(parseOptionalDollars("  ")).toEqual({ ok: true, cents: null });
  });

  it.each([
    ["65", 6500],
    ["65.5", 6550],
    ["65.05", 6505],
    ["$65.00", 6500],
    ["1,065.00", 106_500],
    [".29", 29],
    ["5000", 500_000],
  ])("reads %s", (raw, cents) => {
    expect(parseOptionalDollars(raw)).toEqual({ ok: true, cents });
  });

  it.each(["0", "0.00", "abc", "65.", "65.123", "-5", "5000.01", "1,0,0", "6 5"])(
    "rejects %s",
    (raw) => {
      expect(parseOptionalDollars(raw)).toEqual({ ok: false });
    },
  );
});

describe("refusePaymentChange", () => {
  const unpaid = {};
  const deskPaid = { paidAtMs: 1, paymentMethod: "cash" };
  const squarePaid = { paidAtMs: 1, paidAmountCents: 6500, paymentMethod: "square_online", squarePaymentId: "sq" };
  const legacySquarePaid = { paidAmountCents: 6500, squarePaymentId: "sq" };

  it("records a payment on pending or confirmed visits", () => {
    for (const bookingStatus of ["pending", "confirmed"]) {
      expect(
        refusePaymentChange({ action: "mark_paid", bookingStatus, payment: unpaid, role: "front_desk" }),
      ).toBeNull();
    }
  });

  it("refuses cancelled and declined visits", () => {
    for (const bookingStatus of ["cancelled", "declined"]) {
      expect(
        refusePaymentChange({ action: "mark_paid", bookingStatus, payment: unpaid, role: "manager" })
          ?.code,
      ).toBe("not_payable");
    }
  });

  it("won't record over an existing payment", () => {
    expect(
      refusePaymentChange({ action: "mark_paid", bookingStatus: "confirmed", payment: squarePaid, role: "superadmin" })
        ?.code,
    ).toBe("already_paid");
  });

  it("lets front desk undo a desk payment", () => {
    expect(
      refusePaymentChange({ action: "mark_unpaid", bookingStatus: "confirmed", payment: deskPaid, role: "front_desk" }),
    ).toBeNull();
  });

  it("keeps undoing an online Square payment to managers", () => {
    for (const payment of [squarePaid, legacySquarePaid]) {
      expect(
        refusePaymentChange({ action: "mark_unpaid", bookingStatus: "confirmed", payment, role: "front_desk" })
          ?.code,
      ).toBe("square_requires_manager");
      expect(
        refusePaymentChange({ action: "mark_unpaid", bookingStatus: "confirmed", payment, role: "manager" }),
      ).toBeNull();
    }
  });

  it("refuses to undo a visit that isn't paid", () => {
    expect(
      refusePaymentChange({ action: "mark_unpaid", bookingStatus: "confirmed", payment: unpaid, role: "manager" })
        ?.code,
    ).toBe("not_paid");
  });
});
