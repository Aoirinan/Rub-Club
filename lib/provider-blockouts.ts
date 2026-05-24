import { DateTime } from "luxon";
import { TIME_ZONE } from "./constants";
import {
  type ProviderBlockOut,
  type ProviderDayHours,
  type ProviderHoursContext,
  type WeekdayKey,
  dayHoursForDate,
  weekdayKeyFromDate,
} from "./provider-profile";
import type { DayWindow } from "./slots-luxon";

function dateInRange(dateStr: string, start?: string, end?: string): boolean {
  if (!start) return false;
  const endYmd = end && end >= start ? end : start;
  return dateStr >= start && dateStr <= endYmd;
}

function customRangeOnDay(
  dateStr: string,
  block: ProviderBlockOut,
): DayWindow | null {
  if (block.mode !== "custom") return null;
  const day = DateTime.fromISO(dateStr, { zone: TIME_ZONE }).startOf("day");
  const open = day.set({
    hour: block.customStartHour ?? 0,
    minute: block.customStartMinute ?? 0,
    second: 0,
    millisecond: 0,
  });
  const close = day.set({
    hour: block.customEndHour ?? 23,
    minute: block.customEndMinute ?? 59,
    second: 0,
    millisecond: 0,
  });
  if (!open.isValid || close <= open) return null;
  return { open, close };
}

function blockAppliesOnDate(block: ProviderBlockOut, dateStr: string): boolean {
  if (block.kind === "recurring") {
    if (!block.weekday) return false;
    return weekdayKeyFromDate(dateStr) === block.weekday;
  }
  return dateInRange(dateStr, block.startDate, block.endDate);
}

/** Intervals blocked on a given calendar day for calendar rendering. */
export function blockOutIntervalsForDay(
  dateStr: string,
  blockOuts: ProviderBlockOut[],
  hoursCtx: ProviderHoursContext,
): DayWindow[] {
  const dayHours = dayHoursForDate(dateStr, hoursCtx);
  const intervals: DayWindow[] = [];
  for (const block of blockOuts) {
    if (!blockAppliesOnDate(block, dateStr)) continue;
    if (block.mode === "office_hours") {
      if (dayHours?.open) {
        const day = DateTime.fromISO(dateStr, { zone: TIME_ZONE }).startOf("day");
        intervals.push({
          open: day.set({
            hour: dayHours.openHour,
            minute: dayHours.openMinute,
            second: 0,
            millisecond: 0,
          }),
          close: day.set({
            hour: dayHours.closeHour,
            minute: dayHours.closeMinute,
            second: 0,
            millisecond: 0,
          }),
        });
      } else {
        const day = DateTime.fromISO(dateStr, { zone: TIME_ZONE }).startOf("day");
        intervals.push({
          open: day,
          close: day.plus({ days: 1 }),
        });
      }
      continue;
    }
    const custom = customRangeOnDay(dateStr, block);
    if (custom) intervals.push(custom);
  }
  return intervals;
}

function intervalsOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
}

export function appointmentBlockedByBlockOut(
  start: DateTime,
  durationMin: number,
  blockOuts: ProviderBlockOut[],
  hoursCtx: ProviderHoursContext,
): boolean {
  const z = start.setZone(TIME_ZONE);
  const dateStr = z.toFormat("yyyy-LL-dd");
  const apptStart = z.toMillis();
  const apptEnd = z.plus({ minutes: durationMin }).toMillis();
  const intervals = blockOutIntervalsForDay(dateStr, blockOuts, hoursCtx);
  for (const iv of intervals) {
    if (intervalsOverlap(apptStart, apptEnd, iv.open.toMillis(), iv.close.toMillis())) {
      return true;
    }
  }
  return false;
}

export function newBlockOutId(): string {
  return `bo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
