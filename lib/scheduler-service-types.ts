import type { ProviderBgColorId, ProviderTextColorId } from "./provider-colors";
import type { ServiceLine } from "./constants";

/** Firestore collection: `scheduler_services` */
export type SchedulerServiceVisibility = "both" | "admin_only" | "customer_only";

export type SchedulerServiceDoc = {
  name: string;
  /** When set, limits which public booking flows show this service. */
  serviceLines?: ServiceLine[];
  /** Display price (USD); stored as number, e.g. 55 for $55.00 */
  priceCents: number;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  textColor: ProviderTextColorId | null;
  bgColor: ProviderBgColorId | null;
  visibility: SchedulerServiceVisibility;
  sortOrder: number;
  active: boolean;
};

export type SchedulerServiceRow = SchedulerServiceDoc & { id: string };

/** Default clinic service catalog (operational names/prices — not vendor branding). */
export const SCHEDULER_SERVICE_SEED: Omit<SchedulerServiceDoc, "sortOrder">[] = [
  { name: "1/2 HR Dr", serviceLines: ["chiropractic"], priceCents: 0, durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, textColor: "black", bgColor: "light_gray", visibility: "both", active: true },
  { name: "1 HR Dr", serviceLines: ["chiropractic"], priceCents: 0, durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, textColor: "black", bgColor: "light_gray", visibility: "both", active: true },
  { name: "Massage (30 min)", serviceLines: ["massage"], priceCents: 2900, durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, textColor: "black", bgColor: "turquoise", visibility: "both", active: true },
  { name: "Massage (60 min)", serviceLines: ["massage"], priceCents: 5500, durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, textColor: "black", bgColor: "turquoise", visibility: "both", active: true },
  { name: "Massage (90 min)", serviceLines: ["massage"], priceCents: 8400, durationMinutes: 90, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, textColor: "black", bgColor: "turquoise", visibility: "both", active: true },
  { name: "Massage (120 min)", serviceLines: ["massage"], priceCents: 11000, durationMinutes: 120, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, textColor: "black", bgColor: "turquoise", visibility: "both", active: true },
  { name: "Promo 1 hr", serviceLines: ["massage"], priceCents: 4500, durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, textColor: "black", bgColor: "bright_yellow", visibility: "both", active: true },
  { name: "Promo 1/2 hr", serviceLines: ["massage"], priceCents: 0, durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, textColor: "black", bgColor: "bright_yellow", visibility: "both", active: true },
  { name: "Taping", serviceLines: ["chiropractic"], priceCents: 0, durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, textColor: "black", bgColor: "green", visibility: "both", active: true },
  { name: "Hot Stone", serviceLines: ["massage"], priceCents: 0, durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, textColor: "black", bgColor: "orange", visibility: "both", active: true },
];

export function formatServicePrice(priceCents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    priceCents / 100,
  );
}

export function formatServiceDuration(durationMinutes: number): string {
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  if (h === 0) return `0:${String(m).padStart(2, "0")}`;
  return `${h}:${String(m).padStart(2, "0")}`;
}
