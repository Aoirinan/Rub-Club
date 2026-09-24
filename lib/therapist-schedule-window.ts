import { DateTime } from "luxon";
import { TIME_ZONE } from "./constants";

/**
 * Massage therapists see their own schedule only, and only near today: the
 * booking list API clamps any requested range to this window (Chicago days)
 * and drops fields their read-only drawer does not show.
 */
export const THERAPIST_WINDOW_DAYS_BACK = 7;
export const THERAPIST_WINDOW_DAYS_AHEAD = 7;

/** [fromMs, toMs]: start of the day 7 days ago through the end of the day 7 days ahead. */
export function therapistScheduleWindow(nowMs: number): { fromMs: number; toMs: number } {
  const today = DateTime.fromMillis(nowMs).setZone(TIME_ZONE).startOf("day");
  return {
    fromMs: today.minus({ days: THERAPIST_WINDOW_DAYS_BACK }).toMillis(),
    toMs: today.plus({ days: THERAPIST_WINDOW_DAYS_AHEAD + 1 }).toMillis() - 1,
  };
}

/**
 * The requested range cut down to the therapist window. `clamped` says the
 * caller asked for more than it gets; `empty` that nothing of it is left.
 */
export function clampToTherapistWindow(
  fromMs: number,
  toMs: number,
  nowMs: number,
): { fromMs: number; toMs: number; clamped: boolean; empty: boolean } {
  const w = therapistScheduleWindow(nowMs);
  const from = Math.max(fromMs, w.fromMs);
  const to = Math.min(toMs, w.toMs);
  return {
    fromMs: from,
    toMs: to,
    clamped: from !== fromMs || to !== toMs,
    empty: from > to,
  };
}

/**
 * Booking-row fields a therapist's read-only view does not use: staff
 * scheduling notes, payment details and staff accept / cancel records.
 */
export const THERAPIST_HIDDEN_BOOKING_FIELDS = [
  "internalNotes",
  "prepaidOnline",
  "paymentLinkUrl",
  "paymentAmountCents",
  "paidAtMs",
  "paidAmountCents",
  "squarePaymentId",
  "paymentMethod",
  "paymentNote",
  "paymentRecordedByEmail",
  "noShowByEmail",
  "accepted",
  "declined",
  "cancelled",
] as const;

export function withoutTherapistHiddenFields<T extends object>(row: T): T {
  const out: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  for (const key of THERAPIST_HIDDEN_BOOKING_FIELDS) delete out[key];
  return out as T;
}
