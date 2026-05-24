import { DateTime } from "luxon";
import {
  BUSINESS,
  type LocationId,
  type ServiceLine,
  TIME_ZONE,
} from "./constants";
import { dayHoursForDate, type ProviderHoursContext } from "./provider-profile";
import type { BufferSpec } from "./appointment-buffers";
import { blockedSlotStartsForAppointment } from "./appointment-buffers";
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
  durationMin: number,
  buffers?: Pick<BufferSpec, "bufferBeforeMinutes" | "bufferAfterMinutes">,
): string[] {
  const starts = blockedSlotStartsForAppointment(start, {
    durationMinutes: durationMin,
    bufferBeforeMinutes: buffers?.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: buffers?.bufferAfterMinutes ?? 0,
  });
  return starts.map((s) => bucketDocId(locationId, providerId, s));
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

const HOLD_ID_RE = /^(?:paris|sulphur_springs)__hold__(?:all|massage|chiropractic|stretch)__/;
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
  durationMin: number,
): string[] {
  const slots = enumerateThirtyMinuteStarts(start, durationMin);
  const out: string[] = [];
  for (const s of slots) {
    out.push(holdBucketDocId(locationId, "all", s));
    out.push(holdBucketDocId(locationId, serviceLine, s));
  }
  return out;
}

/** Hold scopes for public booking (stretch shares massage calendar holds). */
export function holdBucketIdsForPublicBooking(
  locationId: LocationId,
  serviceLine: ServiceLine,
  start: DateTime,
  durationMin: number,
): string[] {
  if (serviceLine === "stretch") {
    const massage = holdBucketIdsForAppointment(locationId, "massage", start, durationMin);
    const stretch = holdBucketIdsForAppointment(locationId, "stretch", start, durationMin);
    return [...new Set([...massage, ...stretch])];
  }
  return holdBucketIdsForAppointment(locationId, serviceLine, start, durationMin);
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

export function effectiveDayWindowFromHours(
  dateStr: string,
  hoursCtx: ProviderHoursContext,
): DayWindow {
  const day = dayHoursForDate(dateStr, hoursCtx);
  if (!day || !day.open) {
    const d = DateTime.fromISO(dateStr, { zone: TIME_ZONE }).startOf("day");
    return { open: d, close: d };
  }
  return dayBoundsFromSchedule(dateStr, {
    openHour: day.openHour,
    openMinute: day.openMinute,
    closeHour: day.closeHour,
    closeMinute: day.closeMinute,
  });
}

/** @deprecated Use effectiveDayWindowFromHours with providerHoursContext(). */
export function effectiveDayWindow(
  dateStr: string,
  schedule: ProviderDaySchedule | null | undefined,
): DayWindow {
  return effectiveDayWindowFromHours(dateStr, {
    weeklyHours: null,
    legacySchedule: schedule ?? null,
  });
}

export function enumerateCandidateStartsInWindow(
  dateStr: string,
  durationMin: number,
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
export function enumerateCandidateStarts(dateStr: string, durationMin: number): DateTime[] {
  const w = dayBoundsFromBusiness(dateStr);
  return enumerateCandidateStartsInWindow(dateStr, durationMin, w);
}

/** Union of slot starts across several provider schedules (deduped, sorted). */
export function unionCandidateStartsFromSchedules(
  dateStr: string,
  durationMin: number,
  schedules: Array<ProviderDaySchedule | null | undefined>,
): DateTime[] {
  return unionCandidateStartsFromHoursContexts(
    dateStr,
    durationMin,
    schedules.map((sch) => ({ weeklyHours: null, legacySchedule: sch ?? null })),
  );
}

export function unionCandidateStartsFromHoursContexts(
  dateStr: string,
  durationMin: number,
  contexts: ProviderHoursContext[],
): DateTime[] {
  const unique = new Map<string, DateTime>();
  for (const ctx of contexts) {
    const w = effectiveDayWindowFromHours(dateStr, ctx);
    if (!w.open.isValid || w.close <= w.open) continue;
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
  durationMin: number,
  schedule: ProviderDaySchedule | null | undefined,
): boolean {
  return isWithinProviderHours(start, durationMin, {
    weeklyHours: null,
    legacySchedule: schedule ?? null,
  });
}

export function isWithinProviderHours(
  start: DateTime,
  durationMin: number,
  hoursCtx: ProviderHoursContext,
): boolean {
  const z = start.setZone(TIME_ZONE);
  const dateStr = z.toFormat("yyyy-LL-dd");
  const { open, close } = effectiveDayWindowFromHours(dateStr, hoursCtx);
  if (close <= open) return false;
  const end = z.plus({ minutes: durationMin });
  return z >= open && z < close && end <= close && end > z;
}

/** @deprecated Prefer isWithinScheduleWindow; kept for call sites using default hours only. */
export function isWithinBusinessWindow(start: DateTime, durationMin: number): boolean {
  return isWithinScheduleWindow(start, durationMin, null);
}
