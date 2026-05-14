import type { DurationMin, ServiceLine } from "./constants";

function parsePositiveCents(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 50) return null;
  return Math.trunc(n);
}

/**
 * Amount to charge for Square prepay after a public booking request.
 * Per-combination env vars override the single `PUBLIC_BOOKING_PREPAY_CENTS` fallback when set.
 */
export function resolvePublicBookingPrepayCents(
  serviceLine: ServiceLine,
  durationMin: DurationMin,
): number | null {
  let specific: string | undefined;
  if (serviceLine === "massage") {
    specific =
      durationMin === 60
        ? process.env.PUBLIC_BOOKING_PREPAY_MASSAGE_60_CENTS?.trim()
        : process.env.PUBLIC_BOOKING_PREPAY_MASSAGE_30_CENTS?.trim();
  } else {
    specific =
      durationMin === 60
        ? process.env.PUBLIC_BOOKING_PREPAY_CHIROPRACTIC_60_CENTS?.trim()
        : process.env.PUBLIC_BOOKING_PREPAY_CHIROPRACTIC_30_CENTS?.trim();
  }

  const fromSpecific = parsePositiveCents(specific);
  if (fromSpecific !== null) return fromSpecific;

  return parsePositiveCents(process.env.PUBLIC_BOOKING_PREPAY_CENTS?.trim());
}
