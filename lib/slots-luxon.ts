import { DateTime } from "luxon";
import {
  BUSINESS,
  type DurationMin,
  type LocationId,
  TIME_ZONE,
} from "./constants";

export function bucketDocId(locationId: LocationId, start: DateTime): string {
  const z = start.setZone(TIME_ZONE);
  return `${locationId}_${z.toFormat("yyyy-LL-dd")}_${z.toFormat("HHmm")}`;
}

export function bucketDocIdsForAppointment(
  locationId: LocationId,
  start: DateTime,
  durationMin: DurationMin,
): string[] {
  const z = start.setZone(TIME_ZONE);
  const first = z.startOf("minute");
  if (durationMin === 30) return [bucketDocId(locationId, first)];
  return [
    bucketDocId(locationId, first),
    bucketDocId(locationId, first.plus({ minutes: 30 })),
  ];
}

function dayBounds(dateStr: string): { open: DateTime; close: DateTime } {
  const day = DateTime.fromISO(dateStr, { zone: TIME_ZONE }).startOf("day");
  const open = day.set({
    hour: BUSINESS.openHour,
    minute: BUSINESS.openMinute,
    second: 0,
    millisecond: 0,
  });
  const close = day.set({
    hour: BUSINESS.closeHour,
    minute: BUSINESS.closeMinute,
    second: 0,
    millisecond: 0,
  });
  return { open, close };
}

/** Valid appointment start times on a 30-minute grid that fit inside business hours. */
export function enumerateCandidateStarts(
  dateStr: string,
  durationMin: DurationMin,
): DateTime[] {
  const { open, close } = dayBounds(dateStr);
  if (!open.isValid) return [];

  const endLimit = close;
  const out: DateTime[] = [];
  let t = open;
  while (true) {
    const end = t.plus({ minutes: durationMin });
    if (end > endLimit) break;
    out.push(t);
    t = t.plus({ minutes: BUSINESS.slotStepMinutes });
  }
  return out;
}

export function parseStartIsoToDateTime(startIso: string): DateTime | null {
  const dt = DateTime.fromISO(startIso, { setZone: true });
  if (!dt.isValid) return null;
  return dt.setZone(TIME_ZONE);
}

export function isAlignedToSlotGrid(dt: DateTime): boolean {
  const z = dt.setZone(TIME_ZONE);
  if (z.second !== 0 || z.millisecond !== 0) return false;
  return z.minute % BUSINESS.slotStepMinutes === 0;
}

export function isWithinBusinessWindow(
  start: DateTime,
  durationMin: DurationMin,
): boolean {
  const z = start.setZone(TIME_ZONE);
  const { open, close } = dayBounds(z.toFormat("yyyy-LL-dd"));
  const end = z.plus({ minutes: durationMin });
  return z >= open && z < close && end <= close && end > z;
}
