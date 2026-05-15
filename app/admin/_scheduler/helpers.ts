import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";
import type { BookingRow, FilterState, ProviderRow, SchedulerView } from "./types";
import { ALL_STATUSES, DEFAULT_STATUSES } from "./types";
import { isBookingStatus, type BookingStatus } from "@/lib/booking-status";

/** Chicago "today" in yyyy-MM-dd, used as the default scheduler date. */
export function todayChicagoIsoDate(): string {
  return DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd");
}

/** Parse a yyyy-MM-dd string into a Luxon DateTime at the start of that day in Chicago. */
export function chicagoDayStart(date: string): DateTime {
  const dt = DateTime.fromFormat(date, "yyyy-LL-dd", { zone: TIME_ZONE });
  return dt.isValid ? dt.startOf("day") : DateTime.now().setZone(TIME_ZONE).startOf("day");
}

export function chicagoStartOfWeek(date: string): DateTime {
  const dt = chicagoDayStart(date);
  return dt.startOf("week");
}

/** Parse URL search params into a `FilterState`. */
export function readFilters(params: URLSearchParams): FilterState {
  const rawView = params.get("view");
  const view: SchedulerView =
    rawView === "day" || rawView === "week" || rawView === "list" ? rawView : "day";

  const rawLoc = params.get("loc");
  const locationId: FilterState["locationId"] =
    rawLoc === "paris" || rawLoc === "sulphur_springs" ? rawLoc : "all";

  const rawSvc = params.get("svc");
  const serviceLine: FilterState["serviceLine"] =
    rawSvc === "massage" || rawSvc === "chiropractic" ? rawSvc : "all";

  const providerId = params.get("provider") || "all";
  const date = params.get("date") || todayChicagoIsoDate();
  const statusStr = params.get("status");
  const statuses: ReadonlyArray<BookingStatus> = statusStr
    ? (statusStr
        .split(",")
        .map((s) => s.trim())
        .filter(isBookingStatus) as BookingStatus[])
    : DEFAULT_STATUSES;

  return {
    view,
    date,
    locationId,
    serviceLine,
    providerId,
    statuses,
    q: params.get("q") ?? "",
  };
}

/** Serialize a `FilterState` back to a URL search string. */
export function writeFilters(s: FilterState): string {
  const params = new URLSearchParams();
  if (s.view !== "day") params.set("view", s.view);
  if (s.date && s.date !== todayChicagoIsoDate()) params.set("date", s.date);
  if (s.locationId !== "all") params.set("loc", s.locationId);
  if (s.serviceLine !== "all") params.set("svc", s.serviceLine);
  if (s.providerId !== "all") params.set("provider", s.providerId);
  if (s.statuses.length && !statusListEquals(s.statuses, DEFAULT_STATUSES)) {
    params.set("status", s.statuses.join(","));
  }
  if (s.q.trim()) params.set("q", s.q.trim());
  return params.toString();
}

function statusListEquals(
  a: ReadonlyArray<BookingStatus>,
  b: ReadonlyArray<BookingStatus>,
): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  for (const x of b) if (!setA.has(x)) return false;
  return true;
}

/** API query string used for the GET /api/admin/bookings call. */
export function bookingsApiQuery(
  filters: FilterState,
): { qs: string; fromIso: string; toIso: string } {
  const fromIso = filters.view === "day"
    ? chicagoDayStart(filters.date).minus({ hours: 1 }).toUTC().toISO() ?? ""
    : filters.view === "week"
      ? chicagoStartOfWeek(filters.date).minus({ hours: 1 }).toUTC().toISO() ?? ""
      : chicagoDayStart(filters.date).minus({ days: 1 }).toUTC().toISO() ?? "";

  const toIso = filters.view === "day"
    ? chicagoDayStart(filters.date).plus({ days: 1, hours: 1 }).toUTC().toISO() ?? ""
    : filters.view === "week"
      ? chicagoStartOfWeek(filters.date).plus({ days: 7, hours: 1 }).toUTC().toISO() ?? ""
      : chicagoDayStart(filters.date).plus({ days: 60 }).toUTC().toISO() ?? "";

  const params = new URLSearchParams();
  if (fromIso) params.set("from", fromIso);
  if (toIso) params.set("to", toIso);
  if (filters.statuses.length) {
    params.set("status", filters.statuses.join(","));
  } else {
    params.set("status", ALL_STATUSES.join(","));
  }
  if (filters.locationId !== "all") params.set("locationId", filters.locationId);
  if (filters.providerId !== "all") params.set("providerId", filters.providerId);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  return { qs: params.toString(), fromIso, toIso };
}

/** Apply client-side service-line filter (the API can't filter by it today). */
export function filterByService(rows: BookingRow[], svc: FilterState["serviceLine"]): BookingRow[] {
  if (svc === "all") return rows;
  return rows.filter((r) => r.serviceLine === svc);
}

/** Choose which providers should appear as columns for the Day view. */
export function pickColumnProviders(
  providers: ProviderRow[],
  filters: FilterState,
): ProviderRow[] {
  return providers
    .filter((p) => p.active)
    .filter((p) =>
      filters.locationId === "all" ? true : p.locationIds.includes(filters.locationId),
    )
    .filter((p) =>
      filters.serviceLine === "all" ? true : p.serviceLines.includes(filters.serviceLine),
    )
    .filter((p) => (filters.providerId === "all" ? true : p.id === filters.providerId))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName));
}

/** Group + classify bookings for the List view. */
export type ListGroupKey =
  | "actionNeeded"
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "nextWeek"
  | "later"
  | "past";

export type ListGroup = {
  key: ListGroupKey;
  label: string;
  rows: BookingRow[];
};

export function groupBookingsForList(rows: BookingRow[]): ListGroup[] {
  const now = DateTime.now().setZone(TIME_ZONE);
  const todayStart = now.startOf("day");
  const tomorrowStart = todayStart.plus({ days: 1 });
  const dayAfterTomorrow = todayStart.plus({ days: 2 });
  const startOfNextWeek = todayStart.startOf("week").plus({ days: 7 });
  const startOfWeekAfterNext = startOfNextWeek.plus({ days: 7 });

  const pendings: BookingRow[] = [];
  const today: BookingRow[] = [];
  const tomorrow: BookingRow[] = [];
  const thisWeek: BookingRow[] = [];
  const nextWeek: BookingRow[] = [];
  const later: BookingRow[] = [];
  const past: BookingRow[] = [];

  for (const r of rows) {
    const ms = r.startAtMs;
    const dt = ms ? DateTime.fromMillis(ms).setZone(TIME_ZONE) : null;
    if (r.status === "pending") {
      pendings.push(r);
      continue;
    }
    if (!dt) {
      later.push(r);
      continue;
    }
    if (dt < now) {
      past.push(r);
      continue;
    }
    if (dt < tomorrowStart) {
      today.push(r);
      continue;
    }
    if (dt < dayAfterTomorrow) {
      tomorrow.push(r);
      continue;
    }
    if (dt < startOfNextWeek) {
      thisWeek.push(r);
      continue;
    }
    if (dt < startOfWeekAfterNext) {
      nextWeek.push(r);
      continue;
    }
    later.push(r);
  }

  return [
    { key: "actionNeeded", label: "Action needed", rows: pendings },
    { key: "today", label: "Today", rows: today },
    { key: "tomorrow", label: "Tomorrow", rows: tomorrow },
    { key: "thisWeek", label: "Rest of this week", rows: thisWeek },
    { key: "nextWeek", label: "Next week", rows: nextWeek },
    { key: "later", label: "Later", rows: later },
    { key: "past", label: "Past (recent)", rows: past },
  ];
}

/** Lay out a booking block within a 30-min grid starting at `openHour`. */
export function blockGeometry(
  startMs: number,
  durationMin: number,
  openHour: number,
  closeHour: number,
  slotPx: number,
): { topPx: number; heightPx: number; clipped: boolean } {
  const start = DateTime.fromMillis(startMs).setZone(TIME_ZONE);
  const minutesFromOpen = (start.hour - openHour) * 60 + start.minute;
  const totalMinutes = (closeHour - openHour) * 60;
  const minutesPerSlot = 30;
  const topPx = Math.max(0, (minutesFromOpen / minutesPerSlot) * slotPx);
  const requestedHeight = (durationMin / minutesPerSlot) * slotPx;
  const maxHeight = Math.max(0, totalMinutes / minutesPerSlot * slotPx - topPx);
  const heightPx = Math.min(requestedHeight, maxHeight);
  return {
    topPx,
    heightPx,
    clipped: heightPx < requestedHeight || minutesFromOpen < 0,
  };
}

/** Format a Chicago hour for the time gutter (e.g. "9:00 AM"). */
export function formatGutterHour(hour: number): string {
  const dt = DateTime.fromObject({ year: 2026, month: 1, day: 1, hour, minute: 0 }, { zone: TIME_ZONE });
  return dt.toFormat("h:mm a");
}

/** Format a Chicago start time as "h:mm a". */
export function formatChicagoTime(startMs: number): string {
  return DateTime.fromMillis(startMs).setZone(TIME_ZONE).toFormat("h:mm a");
}

/** Friendly relative phrase (Today/Tomorrow/Wed Aug 7) for a millisecond timestamp. */
export function relativeDayLabel(startMs: number): string {
  const dt = DateTime.fromMillis(startMs).setZone(TIME_ZONE);
  const now = DateTime.now().setZone(TIME_ZONE);
  if (dt.hasSame(now, "day")) return "Today";
  if (dt.hasSame(now.plus({ days: 1 }), "day")) return "Tomorrow";
  if (dt.hasSame(now.minus({ days: 1 }), "day")) return "Yesterday";
  return dt.toFormat("ccc LLL d");
}

/** Group multi-visit patients in a column: same-day same patient, chronological order. */
export function patientKeyFromBooking(b: Pick<BookingRow, "id" | "phone" | "email" | "name">): string {
  const raw = typeof b.phone === "string" ? b.phone.replace(/\D/g, "") : "";
  const ten =
    raw.length >= 11 && raw.startsWith("1")
      ? raw.slice(-10)
      : raw.length >= 10
        ? raw.slice(-10)
        : raw;
  if (ten.length >= 10) return `ph:${ten}`;
  const n = (b.name ?? "").trim().toLowerCase();
  const e = (b.email ?? "").trim().toLowerCase();
  if (n || e) return `id:${n}|${e}`;
  return `bid:${b.id}`;
}

export type SameDayStackMeta = { indexInPatient: number; sameDayCount: number };

/** Earliest visit first; stack meta counts visits per patient in this column/day. */
export function sortedColumnRowsWithStackMeta(rows: BookingRow[]): {
  sortedRows: BookingRow[];
  stackMeta: Map<string, SameDayStackMeta>;
} {
  const sortedRows = [...rows].sort((a, b) => (a.startAtMs ?? 0) - (b.startAtMs ?? 0));
  const counts = new Map<string, number>();
  for (const b of sortedRows) {
    const k = patientKeyFromBooking(b);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  const stackMeta = new Map<string, SameDayStackMeta>();
  for (const b of sortedRows) {
    const k = patientKeyFromBooking(b);
    const n = (seen.get(k) ?? 0) + 1;
    seen.set(k, n);
    stackMeta.set(b.id, { indexInPatient: n, sameDayCount: counts.get(k) ?? 1 });
  }
  return { sortedRows, stackMeta };
}

/** Tooltip or inline suffix: ` · Paid` or ` · Pay link`. */
export function paymentHintSuffix(b: BookingRow): string {
  if (typeof b.paidAmountCents === "number" && b.paidAmountCents > 0) return " · Paid";
  if (b.paymentLinkUrl) return " · Pay link";
  return "";
}

/** Compact label for tables (reports, etc.). */
export function paymentStatusShort(b: BookingRow): string {
  if (typeof b.paidAmountCents === "number" && b.paidAmountCents > 0) return "Paid";
  if (b.paymentLinkUrl) return "Pay link";
  if (b.prepaidOnline) return "Prepay";
  return "—";
}
