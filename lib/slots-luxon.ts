import { DateTime } from "luxon";
import {
  BUSINESS,
  type DurationMin,
  type LocationId,
  type ServiceLine,
  TIME_ZONE,
} from "./constants";
import type { ProviderDaySchedule } from "./provider-types";

export type DayWindow = { open: DateTime; close: DateTime };

/** Scope of an admin "block this time" hold. */
export type HoldScope = "all" | ServiceLine;

export function bucketDocId(locationId: LocationId, providerId: string, start: DateTime): string {
  const z = start.setZone(TIME_ZONE);
  const safe = providerId.replace(/[/\\]/g, "");
  return `${locationId}__${safe}__${z.toFormat("yyyy-LL-dd")}__${z.toFormat("HHmm")}`;
}

export function bucketDocIdsForAppointment(
  locationId: LocationId,
  providerId: string,
  start: DateTime,
  durationMin: DurationMin,
): string[] {
  const z = start.setZone(TIME_ZONE);
  const first = z.startOf("minute");
  if (durationMin === 30) return [bucketDocId(locationId, providerId, first)];
  return [
    bucketDocId(locationId, providerId, first),
    bucketDocId(locationId, providerId, first.plus({ minutes: 30 })),
  ];
}

/* ---------------- Hold (block-all-providers) bucket ids ---------------- */

/**
 * Build the 30-minute slot starts a duration covers, e.g. 60 min at 09:00
 * yields [09:00, 09:30]. Always returns at least one slot.
 */
export function enumerateThirtyMinuteStarts(start: DateTime, durationMin: number): DateTime[] {
  const z = start.setZone(TIME_ZONE).startOf("minute");
  const count = Math.max(1, Math.round(durationMin / 30));
  const out: DateTime[] = [];
  for (let i = 0; i < count; i++) out.push(z.plus({ minutes: i * 30 }));
  return out;
}

export function holdBucketDocId(
  locationId: LocationId,
  scope: HoldScope,
  start: DateTime,
): string {
  const z = start.setZone(TIME_ZONE);
  return `${locationId}__hold__${scope}__${z.toFormat("yyyy-LL-dd")}__${z.toFormat("HHmm")}`;
}

const HOLD_ID_RE = /^(?:paris|sulphur_springs)__hold__(?:all|massage|chiropractic)__/;
export function isHoldBucketId(id: string): boolean {
  return HOLD_ID_RE.test(id);
}

/**
 * Hold-bucket ids that would block a provider appointment of this service at
 * this time. Includes both the "all services" scope and the booking's specific
 * service line scope, for every 30-minute slot the booking covers.
 */
export function holdBucketIdsForAppointment(
  locationId: LocationId,
  serviceLine: ServiceLine,
  start: DateTime,
  durationMin: DurationMin,
): string[] {
  const slots = enumerateThirtyMinuteStarts(start, durationMin);
  const out: string[] = [];
  for (const s of slots) {
    out.push(holdBucketDocId(locationId, "all", s));
    out.push(holdBucketDocId(locationId, serviceLine, s));
  }
  return out;
}

/** Bucket ids that a single hold itself writes. */
export function holdBucketIdsForHold(
  locationId: LocationId,
  scope: HoldScope,
  start: DateTime,
  durationMin: number,
): string[] {
  const slots = enumerateThirtyMinuteStarts(start, durationMin);
  return slots.map((s) => holdBucketDocId(locationId, scope, s));
}

function dayBoundsFromBusiness(dateStr: string): DayWindow {
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

function dayBoundsFromSchedule(dateStr: string, schedule: ProviderDaySchedule): DayWindow {
  const day = DateTime.fromISO(dateStr, { zone: TIME_ZONE }).startOf("day");
  const open = day.set({
    hour: schedule.openHour,
    minute: schedule.openMinute,
    second: 0,
    millisecond: 0,
  });
  const close = day.set({
    hour: schedule.closeHour,
    minute: schedule.closeMinute,
    second: 0,
    millisecond: 0,
  });
  return { open, close };
}

export function effectiveDayWindow(
  dateStr: string,
  schedule: ProviderDaySchedule | null | undefined,
): DayWindow {
  if (schedule && typeof schedule.openHour === "number") {
    return dayBoundsFromSchedule(dateStr, schedule);
  }
  return dayBoundsFromBusiness(dateStr);
}

export function enumerateCandidateStartsInWindow(
  dateStr: string,
  durationMin: DurationMin,
  window: DayWindow,
): DateTime[] {
  const { open, close } = window;
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

/** Default site hours (no per-provider override). */
export function enumerateCandidateStarts(dateStr: string, durationMin: DurationMin): DateTime[] {
  const w = dayBoundsFromBusiness(dateStr);
  return enumerateCandidateStartsInWindow(dateStr, durationMin, w);
}

/** Union of slot starts across several provider schedules (deduped, sorted). */
export function unionCandidateStartsFromSchedules(
  dateStr: string,
  durationMin: DurationMin,
  schedules: Array<ProviderDaySchedule | null | undefined>,
): DateTime[] {
  const unique = new Map<string, DateTime>();
  for (const sch of schedules) {
    const w = effectiveDayWindow(dateStr, sch ?? null);
    if (!w.open.isValid) continue;
    const starts = enumerateCandidateStartsInWindow(dateStr, durationMin, w);
    for (const t of starts) {
      const k = t.toUTC().toISO()!;
      if (!unique.has(k)) unique.set(k, t);
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.toMillis() - b.toMillis());
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

export function isWithinScheduleWindow(
  start: DateTime,
  durationMin: DurationMin,
  schedule: ProviderDaySchedule | null | undefined,
): boolean {
  const z = start.setZone(TIME_ZONE);
  const dateStr = z.toFormat("yyyy-LL-dd");
  const { open, close } = effectiveDayWindow(dateStr, schedule ?? null);
  const end = z.plus({ minutes: durationMin });
  return z >= open && z < close && end <= close && end > z;
}

/** @deprecated Prefer isWithinScheduleWindow; kept for call sites using default hours only. */
export function isWithinBusinessWindow(start: DateTime, durationMin: DurationMin): boolean {
  return isWithinScheduleWindow(start, durationMin, null);
}
