"use client";

import Link from "next/link";
import { DateTime } from "luxon";
import { bookingStatusLabel, bookingStatusPillClasses } from "@/lib/booking-status";
import { bufferOnlyIntervals } from "@/lib/appointment-buffers";
import { blockOutIntervalsForDay } from "@/lib/provider-blockouts";
import { providerHoursContext } from "@/lib/provider-profile";
import { providerCalendarStyle, type ProviderCalendarStyle } from "@/lib/provider-colors";
import {
  blockGeometry,
  chicagoDayStart,
  chicagoStartOfWeek,
  formatChicagoTime,
  formatChicagoTimeRange,
  formatGutterHour,
  groupBookingsForList,
  patientKeyFromBooking,
  paymentHintSuffix,
  relativeDayLabel,
  sortedColumnRowsWithStackMeta,
} from "./helpers";
import type { SameDayStackMeta } from "./helpers";
import type { BookingRow, FilterState, ProviderRow } from "./types";

const DAY_OPEN_HOUR = 8;
const DAY_CLOSE_HOUR = 19;
const SLOT_PX = 44;

const ROW_LABELS: { hour: number; label: string }[] = (() => {
  const out: { hour: number; label: string }[] = [];
  for (let h = DAY_OPEN_HOUR; h <= DAY_CLOSE_HOUR; h++) {
    out.push({ hour: h, label: formatGutterHour(h) });
  }
  return out;
})();

const TOTAL_SLOT_PX = (DAY_CLOSE_HOUR - DAY_OPEN_HOUR) * 2 * SLOT_PX;

function startIsoUtcFromDayColumnDrop(
  dateYmd: string,
  yPx: number,
  openHour: number,
  closeHour: number,
  slotPx: number,
): string {
  const day = chicagoDayStart(dateYmd);
  let slotIdx = Math.floor(yPx / slotPx);
  const maxIdx = (closeHour - openHour) * 2 - 1;
  slotIdx = Math.max(0, Math.min(slotIdx, maxIdx));
  const start = day
    .set({ hour: openHour, minute: 0, second: 0, millisecond: 0 })
    .plus({ minutes: slotIdx * 30 });
  return start.toUTC().toISO()!;
}

function intervalsOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
}

type ViewProps = {
  bookings: BookingRow[];
  providers: ProviderRow[];
  providerStyles: Map<string, ProviderCalendarStyle>;
  serviceStyles: Map<string, ProviderCalendarStyle>;
  filters: FilterState;
  onSelect: (id: string) => void;
  /** Manager or superadmin: reschedule and expanded list rows. */
  isManager?: boolean;
  /** Day view: drag a block to another time (same provider column). */
  onRescheduleBooking?: (bookingId: string, startIso: string) => Promise<void>;
  /** Dropped on another provider column (reschedule API does not move providers). */
  onInvalidCrossProviderDrop?: () => void;
  /** Proposed time overlaps another patient’s visit in the same column. */
  onInvalidCrossPatientTimeDrop?: () => void;
};

function blockStyleForBooking(
  booking: BookingRow,
  providerStyles: Map<string, ProviderCalendarStyle>,
  serviceStyles: Map<string, ProviderCalendarStyle>,
  providers: ProviderRow[],
): ProviderCalendarStyle {
  const sid = booking.schedulerServiceId;
  if (sid && serviceStyles.has(sid)) return serviceStyles.get(sid)!;
  const pid = booking.providerId;
  if (pid && providerStyles.has(pid)) return providerStyles.get(pid)!;
  const row = pid ? providers.find((p) => p.id === pid) : null;
  if (row) return providerCalendarStyle(row);
  return providerCalendarStyle({
    id: "unknown",
    displayName: booking.providerDisplayName ?? "Staff",
    textColor: null,
    bgColor: null,
  });
}

function patientProfileHref(b: BookingRow): string | null {
  if (b.patientId) return `/admin/patients/${encodeURIComponent(b.patientId)}`;
  const q = (b.phone ?? b.email ?? b.name ?? "").trim();
  if (!q) return null;
  return `/admin/patient?q=${encodeURIComponent(q)}`;
}

function SchedulerListRow({
  booking: b,
  isManager,
  onSelect,
}: {
  booking: BookingRow;
  isManager: boolean;
  onSelect: (id: string) => void;
}) {
  const timeLabel = b.startAtMs ? formatChicagoTime(b.startAtMs) : "—";
  const patientHref = patientProfileHref(b);

  if (!isManager) {
    return (
      <button
        type="button"
        onClick={() => onSelect(b.id)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <BlockStatusIcon booking={b} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-slate-900">{b.name ?? "Unknown"}</div>
          <div className="truncate text-xs text-slate-600">
            {b.serviceLine ?? "—"} · {timeLabel}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="flex w-full items-center gap-2 px-4 py-3 hover:bg-slate-50">
      <button type="button" onClick={() => onSelect(b.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <BlockStatusIcon booking={b} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-slate-900">{b.name ?? "Unknown"}</div>
          <div className="truncate text-xs text-slate-600">
            {b.serviceLine ?? "—"} · {timeLabel}
          </div>
        </div>
      </button>
      <details className="relative shrink-0">
        <summary
          className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-600 hover:bg-slate-100 [&::-webkit-details-marker]:hidden"
          aria-label="Appointment actions"
        >
          ···
        </summary>
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-slate-800 hover:bg-slate-50"
            onClick={() => onSelect(b.id)}
          >
            Add note
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-slate-800 hover:bg-slate-50"
            onClick={() => onSelect(b.id)}
          >
            Reschedule
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-slate-800 hover:bg-slate-50"
            onClick={() => onSelect(b.id)}
          >
            Cancel
          </button>
          {patientHref ? (
            <Link
              href={patientHref}
              className="block px-3 py-2 text-left text-slate-800 hover:bg-slate-50"
              onClick={(e) => e.stopPropagation()}
            >
              View patient record
            </Link>
          ) : (
            <span className="block px-3 py-2 text-left text-slate-400">View patient record</span>
          )}
        </div>
      </details>
    </div>
  );
}

function MobileDayAgenda({
  bookings,
  filters,
  isManager,
  onSelect,
}: {
  bookings: BookingRow[];
  filters: FilterState;
  isManager: boolean;
  onSelect: (id: string) => void;
}) {
  const dayStart = chicagoDayStart(filters.date);
  const dayStartMs = dayStart.toMillis();
  const dayEndMs = dayStart.plus({ days: 1 }).toMillis();
  const rows = bookings
    .filter((b) => typeof b.startAtMs === "number" && b.startAtMs >= dayStartMs && b.startAtMs < dayEndMs)
    .sort((a, b) => (a.startAtMs ?? 0) - (b.startAtMs ?? 0));

  return (
    <div className="space-y-2 md:hidden">
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
          No appointments this day.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
          {rows.map((b) => (
            <li key={b.id}>
              <SchedulerListRow booking={b} isManager={isManager} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function bookingsForDayProvider(
  rows: BookingRow[],
  providerId: string,
  dayStart: DateTime,
): BookingRow[] {
  const dayStartMs = dayStart.toMillis();
  const dayEndMs = dayStart.plus({ days: 1 }).toMillis();
  return rows.filter((b) => {
    if (b.providerId !== providerId) return false;
    if (typeof b.startAtMs !== "number") return false;
    return b.startAtMs >= dayStartMs && b.startAtMs < dayEndMs;
  });
}

function unassignedBookingsForDay(rows: BookingRow[], dayStart: DateTime): BookingRow[] {
  const dayStartMs = dayStart.toMillis();
  const dayEndMs = dayStart.plus({ days: 1 }).toMillis();
  return rows.filter((b) => {
    if (b.providerId) return false;
    if (typeof b.startAtMs !== "number") return false;
    return b.startAtMs >= dayStartMs && b.startAtMs < dayEndMs;
  });
}

/* ---------------- Day view ---------------- */

export function DayView({
  bookings,
  providers,
  providerStyles,
  serviceStyles,
  filters,
  onSelect,
  isManager = false,
  onRescheduleBooking,
  onInvalidCrossProviderDrop,
  onInvalidCrossPatientTimeDrop,
}: ViewProps) {
  const dayStart = chicagoDayStart(filters.date);
  const unassigned = unassignedBookingsForDay(bookings, dayStart);

  if (providers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="font-semibold text-slate-900">No providers match this filter.</p>
        <p className="mt-2 text-sm text-slate-600">
          Adjust the location, service, or provider filter — or add a provider in Scheduler → Manager.
        </p>
      </div>
    );
  }

  return (
    <>
      <MobileDayAgenda
        bookings={bookings}
        filters={filters}
        isManager={isManager}
        onSelect={onSelect}
      />
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
      <div className="overflow-x-auto">
        <div
          className="grid min-w-full"
          style={{
            gridTemplateColumns: `80px repeat(${providers.length}, minmax(180px, 1fr))`,
          }}
        >
          <div className="sticky top-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Time
          </div>
          {providers.map((p) => (
            <div
              key={p.id}
              className="sticky top-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 last:border-r-0"
            >
              <div className="truncate">{p.displayName}</div>
              <div className="mt-0.5 truncate text-xs font-normal text-slate-500">
                {p.serviceLines.join(", ")} · {p.locationIds.map(prettyLoc).join(", ")}
              </div>
            </div>
          ))}

          <div
            className="relative border-r border-slate-200"
            style={{ height: `${TOTAL_SLOT_PX}px` }}
          >
            {ROW_LABELS.map((r) => (
              <div
                key={r.hour}
                className="absolute left-0 right-0 border-t border-slate-100 px-2 text-[11px] font-medium text-slate-500"
                style={{ top: `${(r.hour - DAY_OPEN_HOUR) * 2 * SLOT_PX}px` }}
              >
                {r.label}
              </div>
            ))}
          </div>

          {providers.map((p) => {
            const rowsRaw = bookingsForDayProvider(bookings, p.id, dayStart);
            const { sortedRows, stackMeta } = sortedColumnRowsWithStackMeta(rowsRaw);
            return (
              <div
                key={p.id}
                className="relative border-r border-slate-200 last:border-r-0"
                style={{ height: `${TOTAL_SLOT_PX}px` }}
                onDragOver={(e) => {
                  if (onRescheduleBooking) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (!onRescheduleBooking) return;
                  e.preventDefault();
                  const rawId = e.dataTransfer.getData("application/x-booking-id");
                  if (!rawId) return;
                  const b = bookings.find((x) => x.id === rawId);
                  if (!b?.providerId) return;
                  if (b.providerId !== p.id) {
                    onInvalidCrossProviderDrop?.();
                    return;
                  }
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const startIso = startIsoUtcFromDayColumnDrop(
                    filters.date,
                    y,
                    DAY_OPEN_HOUR,
                    DAY_CLOSE_HOUR,
                    SLOT_PX,
                  );
                  const newStartMs = Date.parse(startIso);
                  const dur = typeof b.durationMin === "number" ? b.durationMin : 0;
                  const newEndMs = newStartMs + dur * 60 * 1000;
                  if (Number.isFinite(newStartMs) && dur > 0) {
                    const selfKey = patientKeyFromBooking(b);
                    for (const o of sortedRows) {
                      if (o.id === b.id) continue;
                      if (typeof o.startAtMs !== "number" || typeof o.durationMin !== "number") continue;
                      const oEnd = o.startAtMs + o.durationMin * 60 * 1000;
                      if (!intervalsOverlap(newStartMs, newEndMs, o.startAtMs, oEnd)) continue;
                      if (patientKeyFromBooking(o) !== selfKey) {
                        onInvalidCrossPatientTimeDrop?.();
                        return;
                      }
                    }
                  }
                  void onRescheduleBooking(b.id, startIso);
                }}
              >
                {ROW_LABELS.map((r) => (
                  <div
                    key={r.hour}
                    className="absolute left-0 right-0 border-t border-slate-100"
                    style={{ top: `${(r.hour - DAY_OPEN_HOUR) * 2 * SLOT_PX}px` }}
                  />
                ))}
                {ROW_LABELS.flatMap((r) => [
                  <div
                    key={`${r.hour}-30`}
                    className="absolute left-0 right-0 border-t border-dashed border-slate-100"
                    style={{ top: `${((r.hour - DAY_OPEN_HOUR) * 2 + 1) * SLOT_PX}px` }}
                  />,
                ])}

                {blockOutIntervalsForDay(
                  filters.date,
                  p.blockOutTimes ?? [],
                  providerHoursContext(p),
                ).map((iv, idx) => {
                  const startMs = iv.open.toMillis();
                  const endMs = iv.close.toMillis();
                  const durationMin = Math.max(30, Math.round((endMs - startMs) / 60000));
                  const geom = blockGeometry(
                    startMs,
                    durationMin,
                    DAY_OPEN_HOUR,
                    DAY_CLOSE_HOUR,
                    SLOT_PX,
                  );
                  if (geom.heightPx <= 0) return null;
                  return (
                    <div
                      key={`block-${idx}-${startMs}`}
                      className="pointer-events-none absolute left-0 right-0 rounded-md bg-slate-300/55 ring-1 ring-slate-400/40"
                      style={{ top: `${geom.topPx}px`, height: `${geom.heightPx}px` }}
                      title="Provider block out"
                    />
                  );
                })}

                {sortedRows.flatMap((b) => {
                  const startMs = b.startAtMs;
                  const dur = b.durationMin ?? 30;
                  if (!startMs) return [];
                  const before = b.bufferBeforeMinutes ?? 0;
                  const after = b.bufferAfterMinutes ?? 0;
                  if (before === 0 && after === 0) return [];
                  return bufferOnlyIntervals(startMs, {
                    durationMinutes: dur,
                    bufferBeforeMinutes: before,
                    bufferAfterMinutes: after,
                  }).map((iv, idx) => {
                    const blockDur = Math.max(30, Math.round((iv.endMs - iv.startMs) / 60000));
                    const geom = blockGeometry(
                      iv.startMs,
                      blockDur,
                      DAY_OPEN_HOUR,
                      DAY_CLOSE_HOUR,
                      SLOT_PX,
                    );
                    if (geom.heightPx <= 0) return null;
                    return (
                      <div
                        key={`buf-${b.id}-${idx}`}
                        className="pointer-events-none absolute left-0 right-0 rounded-md bg-slate-200/70 ring-1 ring-slate-300/50"
                        style={{ top: `${geom.topPx}px`, height: `${geom.heightPx}px` }}
                        title="Service buffer"
                      />
                    );
                  });
                })}

                {sortedRows.map((b) => (
                  <CalendarBlock
                    key={b.id}
                    booking={b}
                    stackMeta={stackMeta.get(b.id)}
                    blockStyle={blockStyleForBooking(b, providerStyles, serviceStyles, providers)}
                    onSelect={onSelect}
                    onRescheduleBooking={onRescheduleBooking}
                    openHour={DAY_OPEN_HOUR}
                    closeHour={DAY_CLOSE_HOUR}
                    slotPx={SLOT_PX}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {unassigned.length > 0 ? (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Unassigned (first-available, awaiting acceptance)
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unassigned.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onSelect(b.id)}
                  className="relative w-full rounded-lg bg-white px-3 py-2 pr-8 text-left text-sm shadow-sm ring-1 ring-amber-200 hover:ring-amber-400"
                >
                  <div className="absolute right-2 top-2">
                    <BlockStatusIcon booking={b} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-slate-900">
                      {b.name ?? "Unknown"}
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${bookingStatusPillClasses(b.status ?? "pending")}`}
                    >
                      {bookingStatusLabel(b.status ?? "pending")}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {b.startAtMs ? formatChicagoTime(b.startAtMs) : "—"} · {b.serviceLine} · {b.durationMin} min
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
    </>
  );
}

/** Compact status glyph for calendar blocks: confirmed ✓, pending ○, no-show ✗. */
function BlockStatusIcon({ booking }: { booking: BookingRow }) {
  const status = booking.status ?? "pending";
  if (status === "confirmed") {
    return (
      <span className="shrink-0 font-bold opacity-90" title="Confirmed" aria-hidden>
        ✓
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="shrink-0 font-bold opacity-80" title="Pending" aria-hidden>
        ○
      </span>
    );
  }
  return (
    <span className="shrink-0 font-bold opacity-90" title={bookingStatusLabel(status)} aria-hidden>
      ✗
    </span>
  );
}

function CalendarBlock({
  booking,
  stackMeta,
  blockStyle,
  onSelect,
  onRescheduleBooking,
  openHour,
  closeHour,
  slotPx,
}: {
  booking: BookingRow;
  stackMeta?: SameDayStackMeta;
  blockStyle: ProviderCalendarStyle;
  onSelect: (id: string) => void;
  onRescheduleBooking?: (bookingId: string, startIso: string) => Promise<void>;
  openHour: number;
  closeHour: number;
  slotPx: number;
}) {
  if (typeof booking.startAtMs !== "number" || typeof booking.durationMin !== "number") {
    return null;
  }
  const geom = blockGeometry(booking.startAtMs, booking.durationMin, openHour, closeHour, slotPx);
  if (geom.heightPx <= 0) return null;
  const status = booking.status ?? "pending";
  const serviceLabel =
    booking.serviceTypeName?.trim() ||
    (booking.serviceLine === "massage"
      ? "Massage"
      : booking.serviceLine === "chiropractic"
        ? "Chiropractic"
        : booking.serviceLine === "stretch"
          ? "Stretch"
          : (booking.serviceLine ?? "Visit"));
  const dragEnabled =
    Boolean(onRescheduleBooking) &&
    (status === "confirmed" || status === "pending") &&
    Boolean(booking.providerId);
  const multi = stackMeta && stackMeta.sameDayCount > 1;
  const ringClass = multi ? "ring-1 ring-black/20" : "";
  const timeRange = formatChicagoTimeRange(booking.startAtMs, booking.durationMin);
  return (
    <button
      type="button"
      draggable={dragEnabled}
      onDragStart={(e) => {
        if (!dragEnabled) return;
        e.stopPropagation();
        e.dataTransfer.setData("application/x-booking-id", booking.id);
        if (booking.providerId) {
          e.dataTransfer.setData("application/x-booking-provider-id", booking.providerId);
        }
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onSelect(booking.id)}
      className={`group absolute left-1 right-1 overflow-hidden rounded-md border border-black/10 px-2 py-1 text-left text-xs shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-700 ${ringClass} ${status === "declined" || status === "cancelled" ? "opacity-75 line-through" : ""}`}
      style={{ top: `${geom.topPx}px`, height: `${geom.heightPx}px`, ...blockStyle.style }}
      title={`${booking.name ?? "Unknown"} · ${serviceLabel} · ${timeRange}${paymentHintSuffix(booking)}`}
    >
      <div className="flex items-start gap-1 truncate font-semibold leading-tight">
        <BlockStatusIcon booking={booking} />
        <span className="min-w-0 truncate">{booking.name ?? "Unknown"}</span>
        {multi ? (
          <span className="shrink-0 font-normal opacity-80">({stackMeta!.sameDayCount}×)</span>
        ) : null}
      </div>
      <div className="truncate text-[11px] font-medium opacity-95">{serviceLabel}</div>
      <div className="truncate text-[10px] font-medium opacity-90">{timeRange}</div>
    </button>
  );
}

/* ---------------- Week view ---------------- */

export function WeekView({
  bookings,
  providers,
  providerStyles,
  serviceStyles,
  filters,
  onSelect,
}: ViewProps) {
  const weekStart = chicagoStartOfWeek(filters.date);
  const days = Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i }));
  const provider =
    filters.providerId === "all"
      ? null
      : providers.find((p) => p.id === filters.providerId) ?? null;

  if (filters.providerId === "all" || !provider) {
    return (
      <AllProvidersWeekSummary
        bookings={bookings}
        providers={providers}
        providerStyles={providerStyles}
        serviceStyles={serviceStyles}
        days={days}
        onSelect={onSelect}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="grid min-w-full" style={{ gridTemplateColumns: `80px repeat(7, minmax(140px, 1fr))` }}>
          <div className="sticky top-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Time
          </div>
          {days.map((d) => (
            <div
              key={d.toISO()}
              className="sticky top-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 last:border-r-0"
            >
              <div>{d.toFormat("ccc")}</div>
              <div className="text-xs font-normal text-slate-500">{d.toFormat("LLL d")}</div>
            </div>
          ))}

          <div
            className="relative border-r border-slate-200"
            style={{ height: `${TOTAL_SLOT_PX}px` }}
          >
            {ROW_LABELS.map((r) => (
              <div
                key={r.hour}
                className="absolute left-0 right-0 border-t border-slate-100 px-2 text-[11px] font-medium text-slate-500"
                style={{ top: `${(r.hour - DAY_OPEN_HOUR) * 2 * SLOT_PX}px` }}
              >
                {r.label}
              </div>
            ))}
          </div>

          {days.map((d) => {
            const rowsRaw = bookingsForDayProvider(bookings, provider.id, d);
            const { sortedRows, stackMeta } = sortedColumnRowsWithStackMeta(rowsRaw);
            return (
              <div
                key={d.toISO()}
                className="relative border-r border-slate-200 last:border-r-0"
                style={{ height: `${TOTAL_SLOT_PX}px` }}
              >
                {ROW_LABELS.map((r) => (
                  <div
                    key={r.hour}
                    className="absolute left-0 right-0 border-t border-slate-100"
                    style={{ top: `${(r.hour - DAY_OPEN_HOUR) * 2 * SLOT_PX}px` }}
                  />
                ))}
                {sortedRows.map((b) => (
                  <CalendarBlock
                    key={b.id}
                    booking={b}
                    stackMeta={stackMeta.get(b.id)}
                    blockStyle={blockStyleForBooking(b, providerStyles, serviceStyles, providers)}
                    onSelect={onSelect}
                    openHour={DAY_OPEN_HOUR}
                    closeHour={DAY_CLOSE_HOUR}
                    slotPx={SLOT_PX}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AllProvidersWeekSummary({
  bookings,
  providers,
  providerStyles,
  serviceStyles,
  days,
  onSelect,
}: {
  bookings: BookingRow[];
  providers: ProviderRow[];
  providerStyles: Map<string, ProviderCalendarStyle>;
  serviceStyles: Map<string, ProviderCalendarStyle>;
  days: DateTime[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Pick a provider in the toolbar to see their full week grid. This summary lists
        appointments per day so you can see the week at a glance.
      </p>
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {days.map((d) => {
          const dayStartMs = d.toMillis();
          const dayEndMs = d.plus({ days: 1 }).toMillis();
          const rows = bookings
            .filter(
              (b) =>
                typeof b.startAtMs === "number" &&
                b.startAtMs >= dayStartMs &&
                b.startAtMs < dayEndMs,
            )
            .sort((a, b) => (a.startAtMs ?? 0) - (b.startAtMs ?? 0));
          return (
            <section
              key={d.toISO()}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <header className="mb-3 flex items-baseline justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{d.toFormat("ccc, LLL d")}</h3>
                  <p className="text-xs text-slate-500">{providers.length} providers</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {rows.length}
                </span>
              </header>
              {rows.length === 0 ? (
                <p className="text-xs text-slate-500">No appointments.</p>
              ) : (
                <ul className="space-y-1.5">
                  {rows.map((b) => {
                    const style = blockStyleForBooking(b, providerStyles, serviceStyles, providers);
                    const svc =
                      b.serviceLine === "massage"
                        ? "Massage"
                        : b.serviceLine === "chiropractic"
                          ? "Chiropractic"
                          : b.serviceLine === "stretch"
                            ? "Stretch"
                            : (b.serviceLine ?? "Visit");
                    const range =
                      typeof b.startAtMs === "number" && typeof b.durationMin === "number"
                        ? formatChicagoTimeRange(b.startAtMs, b.durationMin)
                        : "—";
                    return (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(b.id)}
                          title={`${b.name ?? "Unknown"} · ${svc} · ${range}${paymentHintSuffix(b)}`}
                          className="relative w-full rounded-md border border-black/10 px-2 py-1.5 pr-7 text-left text-xs shadow-sm hover:brightness-95"
                          style={style.style}
                        >
                          <div className="absolute right-1.5 top-1.5">
                            <BlockStatusIcon booking={b} />
                          </div>
                          <div className="flex items-center gap-1 truncate font-semibold">
                            {b.name ?? "Unknown"}
                          </div>
                          <div className="truncate text-[11px] opacity-95">{svc}</div>
                          <div className="truncate text-[10px] opacity-90">{range}</div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- List view ---------------- */

export function ListView({ bookings, onSelect, isManager = false }: ViewProps) {
  const groups = groupBookingsForList(bookings).filter((g) => g.rows.length > 0);

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="font-semibold text-slate-900">No bookings match these filters.</p>
        <p className="mt-2 text-sm text-slate-600">
          Widen the date range, clear the search, or include more statuses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-baseline justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">{g.label}</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {g.rows.length}
            </span>
          </header>
          <ul className="divide-y divide-slate-100">
            {g.rows.map((b) => (
              <li key={b.id}>
                <SchedulerListRow booking={b} isManager={isManager} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function prettyLoc(id: string): string {
  if (id === "paris") return "Paris";
  if (id === "sulphur_springs") return "Sulphur Springs";
  return id;
}
