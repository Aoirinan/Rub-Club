"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  getIdToken: () => Promise<string | null>;
  defaultDate?: string;
};

type Scope = "all" | "massage" | "chiropractic";

const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours (full workday)" },
  { value: 720, label: "12 hours (max)" },
];

export function BlockTimeDrawer({
  open,
  onClose,
  onCreated,
  getIdToken,
  defaultDate,
}: Props) {
  const [locationId, setLocationId] = useState<"paris" | "sulphur_springs">("paris");
  const [scope, setScope] = useState<Scope>("all");
  const [date, setDate] = useState(defaultDate ?? DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd"));
  const [time, setTime] = useState("12:00");
  const [durationMin, setDurationMin] = useState<number>(60);
  const [note, setNote] = useState("");

  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(null);
      setDate(defaultDate ?? DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd"));
    }
  }, [open, defaultDate]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 7; h <= 19; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  }, []);

  const endLabel = useMemo(() => {
    const dt = DateTime.fromISO(`${date}T${time}`, { zone: TIME_ZONE });
    if (!dt.isValid) return "";
    return dt.plus({ minutes: durationMin }).toFormat("h:mm a");
  }, [date, time, durationMin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await getIdToken();
      if (!token) {
        setError("Not signed in.");
        return;
      }

      const startDt = DateTime.fromISO(`${date}T${time}`, { zone: TIME_ZONE });
      if (!startDt.isValid) {
        setError("Invalid date/time.");
        return;
      }
      const startIso = startDt.toUTC().toISO()!;

      const res = await fetch("/api/admin/holds", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          locationId,
          scope,
          startIso,
          durationMin,
          note: note.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to create hold.");
        return;
      }

      setSuccess(
        `Blocked ${scopeLabel(scope)} at ${locationLabel(locationId)} from ${startDt.toFormat("h:mm a")} to ${endLabel}.`,
      );
      setNote("");
      onCreated();
    } finally {
      setWorking(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/40"
        onClick={onClose}
        aria-label="Close"
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="block-time-title"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Block time</p>
            <h2 id="block-time-title" className="text-lg font-semibold text-slate-900">
              Make a time unavailable
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-5 px-6 py-5">
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Holds hide a time on the public booking page across all providers in the chosen
              scope. Use this for lunch breaks, team meetings, holidays, or any time the office is
              not taking new bookings. Existing appointments are not affected.
            </p>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Where &amp; what
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Location</span>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value as "paris" | "sulphur_springs")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="paris">Paris, TX</option>
                    <option value="sulphur_springs">Sulphur Springs, TX</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Scope</span>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as Scope)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="all">All services (massage + chiropractic)</option>
                    <option value="massage">Massage only</option>
                    <option value="chiropractic">Chiropractic only</option>
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                When
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Date</span>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Start (CT)</span>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {timeSlots.map((t) => {
                      const dt = DateTime.fromISO(`2000-01-01T${t}`, { zone: TIME_ZONE });
                      return (
                        <option key={t} value={t}>
                          {dt.toFormat("h:mm a")}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700">Duration</span>
                <select
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {DURATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              {endLabel ? (
                <p className="text-xs text-slate-600">Ends at {endLabel} ({TIME_ZONE}).</p>
              ) : null}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reason (optional)
              </legend>
              <textarea
                rows={2}
                maxLength={400}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Staff lunch, team meeting, holiday close"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </fieldset>
          </div>

          <footer className="border-t border-slate-200 px-6 py-4 space-y-3">
            {error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {success}
              </p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={working}
                className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {working ? "Blocking…" : "Block this time"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={working}
                className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </>
  );
}

function scopeLabel(scope: Scope): string {
  if (scope === "all") return "all services";
  if (scope === "massage") return "massage";
  return "chiropractic";
}

function locationLabel(id: "paris" | "sulphur_springs"): string {
  return id === "paris" ? "Paris" : "Sulphur Springs";
}
