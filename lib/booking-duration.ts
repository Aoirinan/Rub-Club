/** Valid appointment lengths for slot grid (30-minute steps). */
export function isValidBookingDurationMin(n: number): boolean {
  return Number.isInteger(n) && n >= 15 && n <= 480 && n % 30 === 0;
}
