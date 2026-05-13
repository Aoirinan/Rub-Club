"use client";

import { DateTime } from "luxon";
import {
  bookingStatusBlockClasses,
  bookingStatusLabel,
  bookingStatusPillClasses,
} from "@/lib/booking-status";
import {
  blockGeometry,
  chicagoDayStart,
  chicagoStartOfWeek,
  formatChicagoTime,
  formatGutterHour,
  groupBookingsForList,
  relativeDayLabel,
} from "./helpers";
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

type ViewProps = {
  bookings: BookingRow[];
  providers: ProviderRow[];
  filters: FilterState;
  onSelect: (id: string) => void;
};

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

export function DayView({ bookings, providers, filters, onSelect }: ViewProps) {
  const dayStart = chicagoDayStart(filters.date);
  const unassigned = unassignedBookingsForDay(bookings, dayStart);

  if (providers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="font-semibold text-slate-900">No providers match this filter.</p>
        <p className="mt-2 text-sm text-slate-600">
          Adjust the location, service, or provider filter — or add a provider in the
          superadmin tools.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
            const rows = bookingsForDayProvider(bookings, p.id, dayStart);
            return (
              <div
                key={p.id}
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
                {ROW_LABELS.flatMap((r) => [
                  <div
                    key={`${r.hour}-30`}
                    className="absolute left-0 right-0 border-t border-dashed border-slate-100"
                    style={{ top: `${((r.hour - DAY_OPEN_HOUR) * 2 + 1) * SLOT_PX}px` }}
                  />,
                ])}

                {rows.map((b) => (
                  <CalendarBlock
                    key={b.id}
                    booking={b}
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
                  className="w-full rounded-lg bg-white px-3 py-2 text-left text-sm shadow-sm ring-1 ring-amber-200 hover:ring-amber-400"
                >
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
  );
}

function CalendarBlock({
  booking,
  onSelect,
  openHour,
  closeHour,
  slotPx,
}: {
  booking: BookingRow;
  onSelect: (id: string) => void;
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
  return (
    <button
      type="button"
      onClick={() => onSelect(booking.id)}
      className={`absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1 text-left text-xs shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-500 ${bookingStatusBlockClasses(status)}`}
      style={{ top: `${geom.topPx}px`, height: `${geom.heightPx}px` }}
      title={`${booking.name ?? ""} · ${booking.serviceLine ?? ""} · ${booking.durationMin}m`}
    >
      <div className="truncate font-semibold">
        {formatChicagoTime(booking.startAtMs)} · {booking.name ?? "Unknown"}
      </div>
      <div className="truncate text-[11px] opacity-90">
        {booking.serviceLine} · {booking.durationMin}m
      </div>
    </button>
  );
}

/* ---------------- Week view ---------------- */

export function WeekView({ bookings, providers, filters, onSelect }: ViewProps) {
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
            const rows = bookingsForDayProvider(bookings, provider.id, d);
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
                {rows.map((b) => (
                  <CalendarBlock
                    key={b.id}
                    booking={b}
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
  days,
  onSelect,
}: {
  bookings: BookingRow[];
  providers: ProviderRow[];
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
                  {rows.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(b.id)}
                        className={`w-full rounded-md px-2 py-1.5 text-left text-xs ${bookingStatusBlockClasses(b.status ?? "pending")}`}
                      >
                        <div className="font-semibold">
                          {b.startAtMs ? formatChicagoTime(b.startAtMs) : "—"} ·{" "}
                          {b.name ?? "Unknown"}
                        </div>
                        <div className="text-[11px] opacity-90">
                          {b.providerDisplayName || "First avail"} · {b.serviceLine} · {b.durationMin}m
                        </div>
                      </button>
                    </li>
                  ))}
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

export function ListView({ bookings, onSelect }: ViewProps) {
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
                <button
                  type="button"
                  onClick={() => onSelect(b.id)}
                  className="flex w-full flex-wrap items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <div className="min-w-[140px] flex-shrink-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {b.startAtMs ? relativeDayLabel(b.startAtMs) : "—"}
                    </div>
                    <div className="text-xs text-slate-600">
                      {b.startAtMs ? formatChicagoTime(b.startAtMs) : ""}
                      {typeof b.durationMin === "number" ? ` · ${b.durationMin} min` : ""}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{b.name ?? "Unknown"}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${bookingStatusPillClasses(b.status ?? "pending")}`}
                      >
                        {bookingStatusLabel(b.status ?? "pending")}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      {b.serviceLine} · {prettyLoc(b.locationId ?? "")} · {b.providerDisplayName || "First available"}
                    </div>
                    {b.phone || b.email ? (
                      <div className="mt-0.5 text-xs text-slate-500">
                        {b.phone ?? ""}
                        {b.phone && b.email ? " · " : ""}
                        {b.email ?? ""}
                      </div>
                    ) : null}
                  </div>
                </button>
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
