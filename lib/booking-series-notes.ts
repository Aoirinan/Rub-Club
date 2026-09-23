/**
 * Wording for recurring-series booking notifications (app/api/bookings).
 * Every line describes only the visits that were actually booked; dates that
 * were skipped because the slot was taken get one short factual line.
 */

export type SeriesFrequency = "weekly" | "biweekly";

export function seriesCadenceLabel(frequency: SeriesFrequency | undefined): string {
  return frequency === "biweekly" ? "every-other-week" : "weekly";
}

export function skippedDatesLine(skippedLabels: string[]): string | undefined {
  if (skippedLabels.length === 0) return undefined;
  return `These dates could not be booked because the time was already taken: ${skippedLabels.join(", ")}.`;
}

/**
 * Note for the patient's "request received" email. `bookedIds[0]` is the visit
 * the email itself describes; the rest are listed as references.
 */
export function patientSeriesNote(opts: {
  frequency: SeriesFrequency | undefined;
  bookedIds: string[];
  skippedLabels: string[];
}): string | undefined {
  const lines: string[] = [];
  if (opts.bookedIds.length > 1) {
    lines.push(
      `We also received ${opts.bookedIds.length - 1} additional ${seriesCadenceLabel(opts.frequency)} visit(s) on the same weekday. Each is pending office confirmation (references: ${opts.bookedIds.slice(1).join(", ")}).`,
    );
  }
  const skipped = skippedDatesLine(opts.skippedLabels);
  if (skipped) lines.push(skipped);
  return lines.length ? lines.join(" ") : undefined;
}

/** Lines placed at the top of the office notification for a recurring request. */
export function officeSeriesLines(opts: {
  frequency: SeriesFrequency | undefined;
  requestedCount: number;
  bookedIds: string[];
  skippedLabels: string[];
}): string[] {
  const lines = [
    `Patient requested ${opts.requestedCount} recurring ${seriesCadenceLabel(opts.frequency)} visits (same weekday).`,
    `Booking IDs: ${opts.bookedIds.join(", ")}`,
  ];
  const skipped = skippedDatesLine(opts.skippedLabels);
  if (skipped) lines.push(skipped);
  return lines;
}
