/**
 * How a visit turned out, as the front desk records it: checked in, or marked
 * a no-show (the two are mutually exclusive — see
 * app/api/admin/bookings/[id]/visit-state). Visits with neither mark keep the
 * older inference: confirmed, in the past and never checked in.
 */

export type VisitOutcomeInput = {
  status?: unknown;
  startAtMs?: number | null;
  checkedIn: boolean;
  /** The booking's explicit `noShow` mark. */
  noShow?: unknown;
};

/** Whether a booking counts toward a patient's no-show total. */
export function countsAsNoShow(v: VisitOutcomeInput, nowMs: number): boolean {
  if (v.status === "cancelled" || v.status === "declined") return false;
  if (v.checkedIn) return false;
  if (v.noShow === true) return true;
  return v.status === "confirmed" && typeof v.startAtMs === "number" && v.startAtMs < nowMs;
}

/** Why a booking can't be marked a no-show yet, or null when it can. */
export function noShowRefusal(
  v: { status?: unknown; startAtMs?: number | null },
  nowMs: number,
): string | null {
  if (v.status !== "confirmed") return "Only a confirmed appointment can be marked a no-show.";
  if (typeof v.startAtMs !== "number" || v.startAtMs > nowMs) {
    return "A visit can be marked a no-show only once its start time has passed.";
  }
  return null;
}
