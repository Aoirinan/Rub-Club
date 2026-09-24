/**
 * Eligibility window for the post-visit survey cron (app/api/cron/surveys).
 * A confirmed visit is surveyed once, when its end time is at least 20 minutes
 * and at most 7 days in the past.
 */

export const SURVEY_MIN_AFTER_END_MS = 20 * 60 * 1000;
export const SURVEY_MAX_AFTER_END_MS = 7 * 24 * 60 * 60 * 1000;
/** Longest bookable visit (lib/booking-duration.ts). */
export const SURVEY_MAX_DURATION_MIN = 480;
/** Shortest visit length accepted by lib/booking-doc.ts. */
export const SURVEY_MIN_DURATION_MIN = 15;

/**
 * `startAt` range that contains every visit whose end can fall inside the
 * survey window: [fromMs, beforeMs).
 */
export function surveyStartAtWindow(nowMs: number): { fromMs: number; beforeMs: number } {
  return {
    fromMs: nowMs - SURVEY_MAX_AFTER_END_MS - SURVEY_MAX_DURATION_MIN * 60 * 1000,
    beforeMs: nowMs - SURVEY_MIN_AFTER_END_MS - SURVEY_MIN_DURATION_MIN * 60 * 1000 + 1,
  };
}

/**
 * A visit the front desk marked as a no-show gets no "how was your visit"
 * email. A visit merely lacking a check-in is still surveyed: the desk does
 * not check everyone in.
 */
export function surveySkippedForNoShow(noShow: unknown): boolean {
  return noShow === true;
}

export type SurveyTiming = "eligible" | "bad_duration" | "too_soon" | "too_old";

export function surveyTiming(startMs: number, durationMin: unknown, nowMs: number): SurveyTiming {
  if (
    typeof durationMin !== "number" ||
    !Number.isFinite(durationMin) ||
    durationMin < SURVEY_MIN_DURATION_MIN ||
    durationMin > SURVEY_MAX_DURATION_MIN
  ) {
    return "bad_duration";
  }
  const endMs = startMs + durationMin * 60 * 1000;
  if (endMs > nowMs - SURVEY_MIN_AFTER_END_MS) return "too_soon";
  if (endMs < nowMs - SURVEY_MAX_AFTER_END_MS) return "too_old";
  return "eligible";
}
