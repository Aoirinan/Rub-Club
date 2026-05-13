import { DateTime } from "luxon";
import { TIME_ZONE } from "./constants";

const locale = "en-US" as const;

/** Slot buttons / public booking list: weekday, date, 12-hour time, zone abbreviation (e.g. CDT). */
export function formatChicagoSlotChoice(dt: DateTime): string {
  return dt.setZone(TIME_ZONE).toFormat("cccc, LLL d — h:mm a (z)", { locale });
}

/** Admin tables: full date and 12-hour time in Chicago. */
export function formatChicagoStartIso(iso: string | undefined | null): string {
  if (!iso?.trim()) return "—";
  const dt = DateTime.fromISO(iso, { setZone: true });
  if (!dt.isValid) return iso;
  return dt.setZone(TIME_ZONE).toFormat("cccc, LLL d yyyy, h:mm a (z)", { locale });
}

/** Email subject lines: shorter Chicago 12-hour phrase. */
export function formatChicagoDateTimeShort(dt: DateTime): string {
  return dt.setZone(TIME_ZONE).toFormat("LLL d, h:mm a (z)", { locale });
}

/** Office notification body: long Chicago 12-hour line. */
export function formatChicagoDateTimeLong(dt: DateTime): string {
  return dt.setZone(TIME_ZONE).toFormat("cccc, LLL d yyyy — h:mm a (z)", { locale });
}
