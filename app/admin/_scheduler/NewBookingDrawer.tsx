"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";
import type { ProviderRow } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  getIdToken: () => Promise<string | null>;
  providers: ProviderRow[];
  /** Pre-fill date from the scheduler's current view (yyyy-MM-dd Chicago). */
  defaultDate?: string;
};

export function NewBookingDrawer({
  open,
  onClose,
  onCreated,
  getIdToken,
  providers,
  defaultDate,
}: Props) {
  const [locationId, setLocationId] = useState<"paris" | "sulphur_springs">("paris");
  const [serviceLine, setServiceLine] = useState<"massage" | "chiropractic">("massage");
  const [durationMin, setDurationMin] = useState<30 | 60>(60);
  const [date, setDate] = useState(defaultDate ?? DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd"));
  const [time, setTime] = useState("09:00");
  const [providerId, setProviderId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed");
  const [skipConflictCheck, setSkipConflictCheck] = useState(false);

  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      setDate(defaultDate ?? DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd"));
    }
  }, [open, defaultDate]);

  const filteredProviders = useMemo(
    () =>
      providers
        .filter(
          (p) =>
            p.active &&
            p.locationIds.includes(locationId) &&
            p.serviceLines.includes(serviceLine),
        )
        .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName)),
    [providers, locationId, serviceLine],
  );

  useEffect(() => {
    if (filteredProviders.length > 0 && !filteredProviders.find((p) => p.id === providerId)) {
      setProviderId(filteredProviders[0].id);
    }
  }, [filteredProviders, providerId]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);
    setSuccess(false);

    try {
      const token = await getIdToken();
      if (!token) {
        setError("Not signed in.");
        return;
      }

      const provider = filteredProviders.find((p) => p.id === providerId);
      if (!provider) {
        setError("Please select a provider.");
        return;
      }

      const startDt = DateTime.fromISO(`${date}T${time}`, { zone: TIME_ZONE });
      if (!startDt.isValid) {
        setError("Invalid date/time.");
        return;
      }
      const startIso = startDt.toUTC().toISO()!;

      const res = await fetch("/api/admin/bookings/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          locationId,
          serviceLine,
          durationMin,
          startIso,
          providerId: provider.id,
          providerDisplayName: provider.displayName,
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
          status,
          skipConflictCheck,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to create appointment.");
        return;
      }

      setSuccess(true);
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
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
        aria-labelledby="new-booking-title"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">New appointment</p>
            <h2 id="new-booking-title" className="text-lg font-semibold text-slate-900">
              Add manually
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
            {/* Date and time */}
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
                  <span className="text-xs font-medium text-slate-700">Time (CT)</span>
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
                <div className="flex gap-2">
                  {([30, 60] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationMin(d)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                        durationMin === d
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </label>
            </fieldset>

            {/* Location and Service */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Service details
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
                  <span className="text-xs font-medium text-slate-700">Service</span>
                  <select
                    value={serviceLine}
                    onChange={(e) => setServiceLine(e.target.value as "massage" | "chiropractic")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="massage">Massage</option>
                    <option value="chiropractic">Chiropractic</option>
                  </select>
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700">Provider</span>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {filteredProviders.length === 0 ? (
                    <option value="">No providers for this combination</option>
                  ) : (
                    filteredProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </fieldset>

            {/* Patient info */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Patient
              </legend>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700">Name *</span>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Patient name"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Phone</span>
                  <input
                    type="tel"
                    maxLength={40}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="903-555-1234"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Email</span>
                  <input
                    type="email"
                    maxLength={200}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="patient@email.com"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700">Notes</span>
                <textarea
                  rows={2}
                  maxLength={1200}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Any relevant info…"
                />
              </label>
            </fieldset>

            {/* Options */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Options
              </legend>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700">Initial status</span>
                <div className="flex gap-2">
                  {(["confirmed", "pending"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-semibold capitalize transition ${
                        status === s
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={skipConflictCheck}
                  onChange={(e) => setSkipConflictCheck(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Allow double-booking (skip conflict check)
              </label>
            </fieldset>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 px-6 py-4 space-y-3">
            {error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                Appointment created successfully.
              </p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={working || !name.trim() || !providerId}
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {working ? "Creating…" : "Create appointment"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={working}
                className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </>
  );
}
