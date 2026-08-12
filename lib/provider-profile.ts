import { DateTime } from "luxon";
import type { LocationId } from "./constants";
import { TIME_ZONE } from "./constants";
import type { ProviderDaySchedule } from "./provider-types";

export const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

/** One continuous bookable stretch within a day. */
export type ProviderTimeRange = {
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
};

export type ProviderDayHours = {
  open: boolean;
  /**
   * The first range, mirrored onto these fields so documents stay readable by
   * anything written before split shifts existed. `ranges` is authoritative.
   */
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  /**
   * Split shifts, e.g. 8:00-13:00 and 14:00-17:00. Absent on older documents,
   * in which case the single open/close pair above is the only range.
   */
  ranges?: ProviderTimeRange[];
};

export type ProviderWeeklyHours = Partial<Record<WeekdayKey, ProviderDayHours>>;

const minutesOf = (hour: number, minute: number): number => hour * 60 + minute;

export function rangeIsValid(r: ProviderTimeRange): boolean {
  return minutesOf(r.closeHour, r.closeMinute) > minutesOf(r.openHour, r.openMinute);
}

/**
 * Bookable ranges for a day, sorted and with overlaps merged so a slot can
 * never be produced twice. Returns [] for a closed day.
 */
export function dayHoursRanges(day: ProviderDayHours | null | undefined): ProviderTimeRange[] {
  if (!day || !day.open) return [];
  const raw = day.ranges?.length
    ? day.ranges
    : [
        {
          openHour: day.openHour,
          openMinute: day.openMinute,
          closeHour: day.closeHour,
          closeMinute: day.closeMinute,
        },
      ];
  const sorted = raw
    .filter(rangeIsValid)
    .sort((a, b) => minutesOf(a.openHour, a.openMinute) - minutesOf(b.openHour, b.openMinute));

  const merged: ProviderTimeRange[] = [];
  for (const r of sorted) {
    const prev = merged[merged.length - 1];
    if (prev && minutesOf(r.openHour, r.openMinute) <= minutesOf(prev.closeHour, prev.closeMinute)) {
      if (minutesOf(r.closeHour, r.closeMinute) > minutesOf(prev.closeHour, prev.closeMinute)) {
        prev.closeHour = r.closeHour;
        prev.closeMinute = r.closeMinute;
      }
      continue;
    }
    merged.push({ ...r });
  }
  return merged;
}

/** Build a day whose legacy open/close fields mirror the first range. */
export function makeDayHours(open: boolean, ranges: ProviderTimeRange[]): ProviderDayHours {
  const valid = ranges.filter(rangeIsValid);
  // Fall back to the raw first range so a closed day keeps its stored times and
  // the admin inputs repopulate correctly when it is reopened.
  const first = valid[0] ??
    ranges[0] ?? { openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 };
  return {
    open: open && valid.length > 0,
    openHour: first.openHour,
    openMinute: first.openMinute,
    closeHour: first.closeHour,
    closeMinute: first.closeMinute,
    ranges: valid.length > 0 ? valid.map((r) => ({ ...r })) : [{ ...first }],
  };
}

export type ProviderBlockOut = {
  id: string;
  label?: string;
  kind: "one_time" | "recurring";
  /** Recurring: closed every week on this weekday. */
  weekday?: WeekdayKey;
  /** One-time inclusive yyyy-MM-dd (Chicago calendar day). */
  startDate?: string;
  endDate?: string;
  /** office_hours = whole day closed; custom = specific time range that day. */
  mode: "office_hours" | "custom";
  customStartHour?: number;
  customStartMinute?: number;
  customEndHour?: number;
  customEndMinute?: number;
};

export type ProviderNotificationDay = {
  send: boolean;
  sms: boolean;
  email: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

export type ProviderNotificationWindows = Partial<Record<WeekdayKey, ProviderNotificationDay>>;

export type ProviderCalendarVisibility = "all" | LocationId;

export type ProviderHoursContext = {
  weeklyHours: ProviderWeeklyHours | null;
  legacySchedule: ProviderDaySchedule | null;
};

const DEFAULT_DAY: ProviderDayHours = {
  open: true,
  openHour: 9,
  openMinute: 0,
  closeHour: 17,
  closeMinute: 0,
};

export const DEFAULT_NOTIFICATION_DAY: ProviderNotificationDay = {
  send: true,
  sms: true,
  email: true,
  startHour: 8,
  startMinute: 0,
  endHour: 22,
  endMinute: 0,
};

/** Brandi Collins default hours from implementation script. */
export const BRANDI_WEEKLY_HOURS: ProviderWeeklyHours = {
  mon: { open: true, openHour: 9, openMinute: 0, closeHour: 16, closeMinute: 0 },
  tue: { open: false, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
  wed: { open: true, openHour: 9, openMinute: 0, closeHour: 12, closeMinute: 0 },
  thu: { open: false, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
  fri: { open: true, openHour: 9, openMinute: 0, closeHour: 16, closeMinute: 0 },
  sat: { open: false, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
  sun: { open: false, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
};

export function weekdayKeyFromDate(dateStr: string): WeekdayKey {
  const dt = DateTime.fromISO(dateStr, { zone: TIME_ZONE });
  const luxonWeekday = dt.weekday; // 1=Mon … 7=Sun
  const map: WeekdayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return map[luxonWeekday - 1] ?? "mon";
}

export function weekdayKeyFromMillis(ms: number): WeekdayKey {
  return weekdayKeyFromDate(DateTime.fromMillis(ms).setZone(TIME_ZONE).toFormat("yyyy-LL-dd"));
}

const RANGE_KEYS = ["openHour", "openMinute", "closeHour", "closeMinute"] as const;

function parseTimeRange(raw: unknown): ProviderTimeRange | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const parts: Partial<ProviderTimeRange> = {};
  for (const k of RANGE_KEYS) {
    const n = o[k];
    if (typeof n !== "number" || !Number.isFinite(n)) return null;
    parts[k] = Math.trunc(n);
  }
  // Validity is enforced later, so a closed day stored as 9:00-9:00 still
  // round-trips instead of being dropped and falling back to default hours.
  return parts as ProviderTimeRange;
}

function parseDayHours(raw: unknown): ProviderDayHours | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.open !== "boolean") return null;
  const legacy = parseTimeRange(o);
  const parsedRanges = Array.isArray(o.ranges)
    ? o.ranges.map(parseTimeRange).filter((r): r is ProviderTimeRange => r !== null)
    : [];

  const ranges = parsedRanges.length > 0 ? parsedRanges : legacy ? [legacy] : [];
  if (ranges.length === 0) return null;
  return makeDayHours(o.open, ranges);
}

export function parseWeeklyHours(raw: unknown): ProviderWeeklyHours | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: ProviderWeeklyHours = {};
  let any = false;
  for (const key of WEEKDAY_KEYS) {
    const day = parseDayHours(o[key]);
    if (day) {
      out[key] = day;
      any = true;
    }
  }
  return any ? out : null;
}

export function parseBlockOuts(raw: unknown): ProviderBlockOut[] {
  if (!Array.isArray(raw)) return [];
  const out: ProviderBlockOut[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const kind = o.kind === "one_time" || o.kind === "recurring" ? o.kind : null;
    const mode = o.mode === "office_hours" || o.mode === "custom" ? o.mode : null;
    if (!id || !kind || !mode) continue;
    const weekday =
      typeof o.weekday === "string" && (WEEKDAY_KEYS as readonly string[]).includes(o.weekday)
        ? (o.weekday as WeekdayKey)
        : undefined;
    out.push({
      id,
      kind,
      mode,
      weekday,
      label: typeof o.label === "string" ? o.label.trim() : undefined,
      startDate: typeof o.startDate === "string" ? o.startDate : undefined,
      endDate: typeof o.endDate === "string" ? o.endDate : undefined,
      customStartHour: typeof o.customStartHour === "number" ? o.customStartHour : undefined,
      customStartMinute: typeof o.customStartMinute === "number" ? o.customStartMinute : undefined,
      customEndHour: typeof o.customEndHour === "number" ? o.customEndHour : undefined,
      customEndMinute: typeof o.customEndMinute === "number" ? o.customEndMinute : undefined,
    });
  }
  return out;
}

export function parseNotificationWindows(raw: unknown): ProviderNotificationWindows | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: ProviderNotificationWindows = {};
  let any = false;
  for (const key of WEEKDAY_KEYS) {
    const d = o[key];
    if (!d || typeof d !== "object") continue;
    const day = d as Record<string, unknown>;
    if (typeof day.send !== "boolean") continue;
    const nums = ["startHour", "startMinute", "endHour", "endMinute"] as const;
    const row: Partial<ProviderNotificationDay> = {
      send: day.send,
      sms: day.sms !== false,
      email: day.email !== false,
    };
    for (const k of nums) {
      const n = day[k];
      if (typeof n !== "number" || !Number.isFinite(n)) continue;
      row[k] = Math.trunc(n);
    }
    if (
      typeof row.startHour === "number" &&
      typeof row.startMinute === "number" &&
      typeof row.endHour === "number" &&
      typeof row.endMinute === "number"
    ) {
      out[key] = row as ProviderNotificationDay;
      any = true;
    }
  }
  return any ? out : null;
}

export function parseCalendarVisibility(raw: unknown): ProviderCalendarVisibility {
  if (raw === "paris" || raw === "sulphur_springs") return raw;
  return "all";
}

export function defaultWeeklyHoursFromLegacy(schedule: ProviderDaySchedule | null | undefined): ProviderWeeklyHours {
  const base = schedule
    ? {
        open: true,
        openHour: schedule.openHour,
        openMinute: schedule.openMinute,
        closeHour: schedule.closeHour,
        closeMinute: schedule.closeMinute,
      }
    : { ...DEFAULT_DAY };
  const out: ProviderWeeklyHours = {};
  for (const key of WEEKDAY_KEYS) {
    out[key] = { ...base };
  }
  return out;
}

export function resolveWeeklyHours(
  weeklyHours: ProviderWeeklyHours | null | undefined,
  legacySchedule: ProviderDaySchedule | null | undefined,
  displayName?: string,
): ProviderWeeklyHours {
  if (weeklyHours && Object.keys(weeklyHours).length > 0) return weeklyHours;
  const first = displayName?.trim().split(/\s+/)[0]?.toLowerCase();
  if (first === "brandi" || first === "brandy") return { ...BRANDI_WEEKLY_HOURS };
  return defaultWeeklyHoursFromLegacy(legacySchedule);
}

export function providerHoursContext(provider: {
  weeklyHours?: ProviderWeeklyHours | null;
  schedule?: ProviderDaySchedule | null;
  displayName?: string;
}): ProviderHoursContext {
  return {
    weeklyHours: resolveWeeklyHours(provider.weeklyHours, provider.schedule, provider.displayName),
    legacySchedule: provider.schedule ?? null,
  };
}

export function dayHoursForDate(
  dateStr: string,
  ctx: ProviderHoursContext,
): ProviderDayHours | null {
  const key = weekdayKeyFromDate(dateStr);
  const day = ctx.weeklyHours?.[key];
  if (day) return day;
  if (ctx.legacySchedule) {
    return {
      open: true,
      openHour: ctx.legacySchedule.openHour,
      openMinute: ctx.legacySchedule.openMinute,
      closeHour: ctx.legacySchedule.closeHour,
      closeMinute: ctx.legacySchedule.closeMinute,
    };
  }
  return DEFAULT_DAY;
}

export function defaultNotificationWindows(): ProviderNotificationWindows {
  const out: ProviderNotificationWindows = {};
  for (const key of WEEKDAY_KEYS) {
    out[key] = { ...DEFAULT_NOTIFICATION_DAY };
  }
  return out;
}

export function resolveNotificationWindows(
  raw: ProviderNotificationWindows | null | undefined,
): ProviderNotificationWindows {
  const base = defaultNotificationWindows();
  if (!raw) return base;
  const out = { ...base };
  for (const key of WEEKDAY_KEYS) {
    if (raw[key]) out[key] = { ...DEFAULT_NOTIFICATION_DAY, ...raw[key] };
  }
  return out;
}

export function notificationAllowedNow(
  windows: ProviderNotificationWindows | null | undefined,
  channel: "sms" | "email",
  atMs: number = Date.now(),
): boolean {
  const resolved = resolveNotificationWindows(windows);
  const z = DateTime.fromMillis(atMs).setZone(TIME_ZONE);
  const key = weekdayKeyFromDate(z.toFormat("yyyy-LL-dd"));
  const day = resolved[key] ?? DEFAULT_NOTIFICATION_DAY;
  if (!day.send) return false;
  if (channel === "sms" && !day.sms) return false;
  if (channel === "email" && !day.email) return false;
  const start = z.startOf("day").set({ hour: day.startHour, minute: day.startMinute });
  const end = z.startOf("day").set({ hour: day.endHour, minute: day.endMinute });
  return z >= start && z <= end;
}

export function providerVisibleOnCalendar(
  provider: { calendarVisibility?: ProviderCalendarVisibility | null; locationIds: LocationId[] },
  locationFilter: "all" | LocationId,
): boolean {
  const vis = provider.calendarVisibility ?? "all";
  if (vis === "all") {
    if (locationFilter === "all") return true;
    return provider.locationIds.includes(locationFilter);
  }
  if (locationFilter === "all") return provider.locationIds.includes(vis);
  return vis === locationFilter && provider.locationIds.includes(locationFilter);
}
