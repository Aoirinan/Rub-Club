import { staffMeetsMin, type StaffRole } from "./staff-roles";

/**
 * Appointment payment status for the admin scheduler. The clinic takes most
 * payments in the office (card / cash / check), recorded by staff from the
 * booking drawer (POST /api/admin/bookings/[id]/payment); an online Square
 * checkout is recorded by the Square webhook. Pure helpers, safe to import
 * from client components.
 */

export const IN_OFFICE_PAYMENT_METHODS = ["card", "cash", "check", "other"] as const;
export type InOfficePaymentMethod = (typeof IN_OFFICE_PAYMENT_METHODS)[number];

/** `paymentMethod` the Square webhook writes for an online checkout. */
export const SQUARE_ONLINE_PAYMENT_METHOD = "square_online";
export type PaymentMethod = InOfficePaymentMethod | typeof SQUARE_ONLINE_PAYMENT_METHOD;

export const PAYMENT_NOTE_MAX = 200;
export const PAYMENT_AMOUNT_MAX_CENTS = 500_000;

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    value === SQUARE_ONLINE_PAYMENT_METHOD ||
    (IN_OFFICE_PAYMENT_METHODS as readonly unknown[]).includes(value)
  );
}

export function paymentMethodLabel(method: unknown): string {
  switch (method) {
    case "card":
      return "Card";
    case "cash":
      return "Cash";
    case "check":
      return "Check";
    case "other":
      return "Other";
    case SQUARE_ONLINE_PAYMENT_METHOD:
      return "Online (Square)";
    default:
      return "";
  }
}

/** The booking fields that decide whether (and how) a visit was paid. */
export type BookingPaymentState = {
  paidAtMs?: number | null;
  paidAmountCents?: number | null;
  paymentMethod?: string | null;
  squarePaymentId?: string | null;
};

/**
 * Paid when a payment time is recorded, or (older online payments) a positive
 * amount. An in-office payment may be recorded without an amount.
 */
export function bookingIsPaid(b: BookingPaymentState): boolean {
  if (typeof b.paidAtMs === "number") return true;
  return typeof b.paidAmountCents === "number" && b.paidAmountCents > 0;
}

/**
 * Paid online through Square rather than recorded at the desk. Webhook records
 * from before `paymentMethod` existed carry only `squarePaymentId`.
 */
export function isSquareOnlinePayment(b: BookingPaymentState): boolean {
  if (b.paymentMethod === SQUARE_ONLINE_PAYMENT_METHOD) return true;
  return !b.paymentMethod && typeof b.squarePaymentId === "string" && b.squarePaymentId.length > 0;
}

export function effectivePaymentMethod(b: BookingPaymentState): PaymentMethod | null {
  if (isPaymentMethod(b.paymentMethod)) return b.paymentMethod;
  return isSquareOnlinePayment(b) ? SQUARE_ONLINE_PAYMENT_METHOD : null;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatUsdCents(cents: number): string {
  return usd.format(cents / 100);
}

/** "Paid · Card", or just "Paid" when the method is unknown. Empty when unpaid. */
export function paidStatusLabel(b: BookingPaymentState): string {
  if (!bookingIsPaid(b)) return "";
  const method = paymentMethodLabel(effectivePaymentMethod(b));
  return method ? `Paid · ${method}` : "Paid";
}

/**
 * Optional dollar amount typed at the desk ("65", "65.5", "$1,065.00") →
 * cents. Blank means "no amount"; anything unreadable, zero or above the cap
 * is invalid.
 */
export function parseOptionalDollars(
  raw: string,
): { ok: true; cents: number | null } | { ok: false } {
  const text = raw.trim().replace(/^\$\s*/, "");
  if (!text) return { ok: true, cents: null };
  if (!/^(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?$/.test(text) && !/^\.\d{1,2}$/.test(text)) {
    return { ok: false };
  }
  const cents = Math.round(Number(text.replace(/,/g, "")) * 100);
  if (!Number.isSafeInteger(cents) || cents < 1 || cents > PAYMENT_AMOUNT_MAX_CENTS) {
    return { ok: false };
  }
  return { ok: true, cents };
}

export type PaymentAction = "mark_paid" | "mark_unpaid";

export type PaymentChangeRefusal = {
  code: "not_payable" | "already_paid" | "not_paid" | "square_requires_manager";
  error: string;
};

/**
 * Why the payment route must refuse this change (HTTP 409), or null when it
 * may go ahead. Undoing an online Square payment is manager-only: the desk
 * could otherwise hide a real card payment, and undoing never refunds it.
 */
export function refusePaymentChange(input: {
  action: PaymentAction;
  bookingStatus: unknown;
  payment: BookingPaymentState;
  role: StaffRole;
}): PaymentChangeRefusal | null {
  const paid = bookingIsPaid(input.payment);
  if (input.action === "mark_paid") {
    if (input.bookingStatus === "cancelled" || input.bookingStatus === "declined") {
      return {
        code: "not_payable",
        error: "A cancelled or declined appointment can't be marked paid.",
      };
    }
    if (paid) {
      return {
        code: "already_paid",
        error: "This appointment is already marked paid. Undo that first to record a different payment.",
      };
    }
    return null;
  }
  if (!paid) {
    return { code: "not_paid", error: "This appointment isn't marked paid." };
  }
  if (isSquareOnlinePayment(input.payment) && !staffMeetsMin(input.role, "manager")) {
    return {
      code: "square_requires_manager",
      error:
        "This payment was made online through Square. Only a manager can undo it (undoing does not refund the patient).",
    };
  }
  return null;
}
