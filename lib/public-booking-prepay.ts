import type { ServiceLine } from "./constants";

function parsePositiveCents(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 50) return null;
  return Math.trunc(n);
}

const LINE_ENV_KEY: Record<ServiceLine, string> = {
  massage: "MASSAGE",
  chiropractic: "CHIROPRACTIC",
  stretch: "STRETCH",
};

/**
 * Amount to charge for Square prepay after a public booking request.
 * Looks up `PUBLIC_BOOKING_PREPAY_<LINE>_<DURATION>_CENTS` for the exact
 * service line + duration (e.g. `..._MASSAGE_90_CENTS`), then falls back to the
 * single `PUBLIC_BOOKING_PREPAY_CENTS`. A duration with no configured price is
 * never charged another duration's price.
 */
export function resolvePublicBookingPrepayCents(
  serviceLine: ServiceLine,
  durationMin: number,
): number | null {
  const key = `PUBLIC_BOOKING_PREPAY_${LINE_ENV_KEY[serviceLine]}_${durationMin}_CENTS`;
  const fromSpecific = parsePositiveCents(process.env[key]?.trim());
  if (fromSpecific !== null) return fromSpecific;

  return parsePositiveCents(process.env.PUBLIC_BOOKING_PREPAY_CENTS?.trim());
}
