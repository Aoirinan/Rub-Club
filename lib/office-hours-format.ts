/**
 * Pure hours formatting shared by client components. Kept separate from
 * `lib/office-hours` because that module reaches Firestore through `lib/cms`,
 * and importing a value from it in a client component pulls firebase-admin
 * into the browser bundle.
 */

/**
 * Split a day's hours into its separate shifts so a split schedule can be
 * stacked one range per line instead of wrapping mid-range in narrow columns.
 * "8:00 AM – 1:00 PM, 2:00 PM – 5:00 PM" -> ["8:00 AM – 1:00 PM", "2:00 PM – 5:00 PM"]
 */
export function hoursShifts(hours: string): string[] {
  return hours
    .split(",")
    .map((shift) => shift.trim())
    .filter(Boolean);
}
