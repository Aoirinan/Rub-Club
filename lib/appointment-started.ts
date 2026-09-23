import { DateTime } from "luxon";

/** Shown on the manage page, and returned by its routes, once the visit has started. */
export const APPOINTMENT_STARTED_MESSAGE =
  "This appointment has already started. Please call the office if you need help.";

/**
 * True once a booking's stored start time has arrived. The patient manage link
 * stops offering cancel / reschedule from that moment. A missing or unreadable
 * start counts as not started.
 */
export function appointmentHasStarted(startIso: unknown, now: DateTime = DateTime.now()): boolean {
  if (typeof startIso !== "string" || !startIso.trim()) return false;
  const start = DateTime.fromISO(startIso, { setZone: true });
  if (!start.isValid) return false;
  return now.toMillis() >= start.toMillis();
}
