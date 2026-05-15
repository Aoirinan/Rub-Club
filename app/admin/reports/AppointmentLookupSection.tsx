"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";
import { bookingStatusLabel } from "@/lib/booking-status";
import { ALL_STATUSES, type BookingRow, type ProviderRow } from "@/app/admin/_scheduler/types";
import { paymentStatusShort } from "@/app/admin/_scheduler/helpers";

type Mode = "future" | "past";

function ymdChicago(d: DateTime): string {
  return d.toFormat("yyyy-LL-dd");
}

function previewText(s: string | undefined, max: number): string {
  if (!s?.trim()) return "—";
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function AppointmentLookupSection({
  getIdToken,
}: {
  getIdToken: () => Promise<string | null>;
}) {
  const [mode, setMode] = useState<Mode>("future");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [locationId, setLocationId] = useState("");
  const [serviceLine, setServiceLine] = useState<"all" | "massage" | "chiropractic">("all");
  const [providerId, setProviderId] = useState("");
  const [confirmationStatus, setConfirmationStatus] = useState("");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const defaults = useMemo(() => {
    const now = DateTime.now().setZone(TIME_ZONE).startOf("day");
    if (mode === "future") {
      return { from: ymdChicago(now), to: ymdChicago(now.plus({ days: 30 })) };
    }
    return { from: ymdChicago(now.minus({ days: 30 })), to: ymdChicago(now) };
  }, [mode]);

  useEffect(() => {
    setFromDate(defaults.from);
    setToDate(defaults.to);
  }, [defaults.from, defaults.to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/admin/providers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as { providers: ProviderRow[] };
      if (!cancelled) setProviders(data.providers ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [getIdToken]);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const fromDt = DateTime.fromISO(fromDate, { zone: TIME_ZONE });
      const toDt = DateTime.fromISO(toDate, { zone: TIME_ZONE });
      if (!fromDt.isValid || !toDt.isValid) {
        setError("Use valid from / to dates.");
        return;
      }
      const fromIso = fromDt.startOf("day").minus({ hours: 1 }).toUTC().toISO() ?? "";
      const toIso = toDt.endOf("day").plus({ hours: 1 }).toUTC().toISO() ?? "";
      const params = new URLSearchParams();
      params.set("from", fromIso);
      params.set("to", toIso);
      params.set("status", ALL_STATUSES.join(","));
      if (locationId) params.set("locationId", locationId);
      if (providerId) params.set("providerId", providerId);
      if (confirmationStatus === "confirmed_online" || confirmationStatus === "not_online") {
        params.set("confirmationStatus", confirmationStatus);
      }
      if (qDebounced) params.set("q", qDebounced);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Could not load appointments.");
        return;
      }
      const payload = (await res.json()) as { bookings: BookingRow[] };
      let list = payload.bookings ?? [];
      if (serviceLine !== "all") {
        list = list.filter((b) => b.serviceLine === serviceLine);
      }
      list.sort((a, b) => (a.startAtMs ?? 0) - (b.startAtMs ?? 0));
      setRows(list);
    } finally {
      setLoading(false);
    }
  }, [
    getIdToken,
    fromDate,
    toDate,
    locationId,
    providerId,
    confirmationStatus,
    serviceLine,
    qDebounced,
  ]);

  useEffect(() => {
    if (!fromDate || !toDate) return;
    void load();
  }, [fromDate, toDate, locationId, providerId, confirmationStatus, serviceLine, qDebounced, load]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const saveInternalNotes = useCallback(
    async (bookingId: string, internalNotes: string) => {
      const token = await getIdToken();
      if (!token) {
        setError("Sign in again to save notes.");
        return;
      }
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}/visit-state`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ internalNotes }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; internalNotes?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save internal notes.");
        return;
      }
      setError(null);
      const saved = typeof data.internalNotes === "string" ? data.internalNotes : internalNotes;
      setRows((prev) => prev.map((r) => (r.id === bookingId ? { ...r, internalNotes: saved } : r)));
    },
    [getIdToken],
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Appointment lookup</h2>
        <p className="mt-1 text-xs text-slate-600">
          Future and past visits with filters. Expand a row to read the patient message and edit staff
          internal notes (same field as the scheduler drawer).
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
        {(["future", "past"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              mode === m ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {m === "future" ? "Upcoming" : "Past"}
          </button>
        ))}
      </div>

      <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-slate-700">
          From
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          To
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Location
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="paris">Paris</option>
            <option value="sulphur_springs">Sulphur Springs</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Service
          <select
            value={serviceLine}
            onChange={(e) => setServiceLine(e.target.value as typeof serviceLine)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="massage">Massage</option>
            <option value="chiropractic">Chiropractic</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Provider
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Online confirm
          <select
            value={confirmationStatus}
            onChange={(e) => setConfirmationStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">Any</option>
            <option value="confirmed_online">Confirmed online</option>
            <option value="not_online">Not confirmed online</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
          Search (name, phone, email, id)
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            placeholder="Optional — updates after a short pause"
          />
        </label>
      </div>

      <div className="px-5 pb-3">
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Reload"}
        </button>
      </div>

      {error ? (
        <p className="mx-5 mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto border-t border-slate-100">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">When</th>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Service</th>
              <th className="px-5 py-3">Provider</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Pay</th>
              <th className="px-5 py-3">Online</th>
              <th className="px-5 py-3">Notes preview</th>
              <th className="px-5 py-3"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((b) => {
              const when =
                typeof b.startAtMs === "number"
                  ? DateTime.fromMillis(b.startAtMs).setZone(TIME_ZONE).toFormat("ccc LLL d · h:mm a")
                  : "—";
              const schedDate =
                typeof b.startAtMs === "number"
                  ? DateTime.fromMillis(b.startAtMs).setZone(TIME_ZONE).toFormat("yyyy-LL-dd")
                  : "";
              const online =
                b.confirmationStatus === "confirmed_online"
                  ? "Yes"
                  : b.status === "pending" || b.status === "confirmed"
                    ? "No"
                    : "—";
              const noteBits = [b.notes, b.internalNotes].filter(Boolean).join(" · ");
              const isOpen = expanded.has(b.id);
              return (
                <Fragment key={b.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-800">{when}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {b.phone && b.phone.replace(/\D/g, "").length >= 7 ? (
                        <Link
                          href={`/admin/patient?phone=${encodeURIComponent(b.phone)}`}
                          className="text-sky-800 underline hover:text-sky-950"
                        >
                          {b.name ?? "—"}
                        </Link>
                      ) : (
                        b.name ?? "—"
                      )}
                    </td>
                    <td className="px-5 py-3 capitalize text-slate-700">{b.serviceLine ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-700">{b.providerDisplayName ?? "—"}</td>
                    <td className="px-5 py-3">{bookingStatusLabel(b.status ?? "pending")}</td>
                    <td className="px-5 py-3 text-slate-700">{paymentStatusShort(b)}</td>
                    <td className="px-5 py-3 text-slate-700">{online}</td>
                    <td className="max-w-[200px] truncate px-5 py-3 text-slate-600" title={noteBits}>
                      {previewText(noteBits, 48)}
                    </td>
                    <td className="space-x-2 px-5 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="text-xs font-semibold text-slate-700 underline"
                        onClick={() => toggleExpand(b.id)}
                      >
                        {isOpen ? "Hide" : "Details"}
                      </button>
                      {schedDate ? (
                        <Link
                          href={`/admin?date=${encodeURIComponent(schedDate)}&focus=${encodeURIComponent(b.id)}`}
                          className="text-xs font-semibold text-sky-800 underline"
                        >
                          Scheduler
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="bg-slate-50">
                      <td colSpan={9} className="px-5 py-3 text-xs text-slate-700">
                        <div className="space-y-2">
                          {b.notes ? (
                            <div>
                              <span className="font-semibold text-slate-800">Patient message: </span>
                              <span className="whitespace-pre-line">{b.notes}</span>
                            </div>
                          ) : null}
                          <div>
                            <span className="font-semibold text-slate-800">Internal notes (staff)</span>
                            <textarea
                              key={`${b.id}-${b.internalNotes ?? ""}`}
                              defaultValue={b.internalNotes ?? ""}
                              maxLength={2000}
                              rows={4}
                              placeholder="Optional — staff only"
                              className="mt-1 block w-full max-w-xl rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800"
                              onBlur={(e) => {
                                const v = e.target.value;
                                if (v === (b.internalNotes ?? "")) return;
                                void saveInternalNotes(b.id, v);
                              }}
                            />
                            <p className="mt-1 text-[11px] text-slate-500">Saves when you leave this field.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {!loading && rows.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-500">No appointments in this range.</p>
        ) : null}
      </div>
    </section>
  );
}
