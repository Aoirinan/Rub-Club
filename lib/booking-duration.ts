/** Valid appointment lengths for slot grid (30-minute steps). */
export function isValidBookingDurationMin(n: number): boolean {
  return Number.isInteger(n) && n >= 15 && n <= 480 && n % 30 === 0;
}

/**
 * Lengths a catalog service may have (15–480 whole minutes, as the catalog
 * editor allows), and so what admin create and reschedule accept. Slot buckets
 * round a partial 30-minute slot up, so an off-grid length still blocks every
 * slot it touches. Start times stay on the 30-minute grid.
 */
export function isValidCatalogDurationMin(n: number): boolean {
  return Number.isInteger(n) && n >= 15 && n <= 480;
}

/**
 * Public booking length. A visit for a customer-visible catalog service may use
 * that service's own length (e.g. 45 minutes), the same lengths admin create
 * accepts; without a catalog service only the 30-minute steps are offered.
 * Pass the chosen service's length as `catalogDurationMin` once it has been
 * looked up and checked.
 */
export function isValidPublicBookingDurationMin(
  n: number,
  catalogDurationMin?: number | null,
): boolean {
  if (typeof catalogDurationMin === "number") {
    return n === catalogDurationMin && isValidCatalogDurationMin(n);
  }
  return isValidBookingDurationMin(n);
}
