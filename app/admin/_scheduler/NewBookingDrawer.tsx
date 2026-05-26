"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";
import type { PatientApiRow } from "@/lib/patient-types";
import {
  businessTagFromSchedulerBusiness,
  schedulerDefaultsFromBusiness,
  type PatientBusinessTag,
  type SchedulerBookingMode,
} from "@/lib/patient-business";
import {
  providerMatchesSchedulerBusiness,
  SCHEDULER_BUSINESS_LABELS,
  type SchedulerBusinessId,
} from "@/lib/scheduler-business";
import type { ProviderRow } from "./types";

function resolveDefaultBusiness(
  defaultBusiness: SchedulerBusinessId | undefined,
  schedulerMode: SchedulerBookingMode,
): Exclude<SchedulerBusinessId, "all"> {
  if (defaultBusiness && defaultBusiness !== "all") {
    return defaultBusiness;
  }
  return schedulerMode === "chiropractic" ? "paris_chiro" : "rub_club";
}

const LOCATION_LABELS: Record<"paris" | "sulphur_springs", string> = {
  paris: "Paris",
  sulphur_springs: "Sulphur Springs",
};

const SERVICE_LINE_LABELS: Record<"massage" | "chiropractic" | "stretch", string> = {
  massage: "massage",
  chiropractic: "chiropractic",
  stretch: "stretch",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  getIdToken: () => Promise<string | null>;
  providers: ProviderRow[];
  /** Pre-fill date from the scheduler's current view (yyyy-MM-dd Chicago). */
  defaultDate?: string;
  /** Pre-fill business from the scheduler filter when not "all". */
  defaultBusiness?: Exclude<SchedulerBusinessId, "all">;
  schedulerMode?: SchedulerBookingMode;
};

export function NewBookingDrawer({
  open,
  onClose,
  onCreated,
  getIdToken,
  providers,
  defaultDate,
  defaultBusiness,
  schedulerMode = "bodywork",
}: Props) {
  const [business, setBusiness] = useState<Exclude<SchedulerBusinessId, "all">>(() =>
    resolveDefaultBusiness(defaultBusiness, schedulerMode),
  );
  const initialDefaults = schedulerDefaultsFromBusiness(
    resolveDefaultBusiness(defaultBusiness, schedulerMode),
    { schedulerMode },
  );
  const [locationId, setLocationId] = useState<"paris" | "sulphur_springs">(
    initialDefaults.locationId,
  );
  const [serviceLine, setServiceLine] = useState<"massage" | "chiropractic" | "stretch">(
    initialDefaults.serviceLine,
  );
  const [patientBusinessTag, setPatientBusinessTag] = useState<PatientBusinessTag>("rub_club");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientHits, setPatientHits] = useState<PatientApiRow[]>([]);
  const [sendFirstTimeNotification, setSendFirstTimeNotification] = useState(true);
  const [durationMin, setDurationMin] = useState<number>(60);
  const [schedulerServiceId, setSchedulerServiceId] = useState("");
  const [schedulerServices, setSchedulerServices] = useState<
    { id: string; name: string; durationMinutes: number }[]
  >([]);
  const [date, setDate] = useState(defaultDate ?? DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd"));
  const [time, setTime] = useState("09:00");
  const [providerId, setProviderId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed");
  const [skipConflictCheck, setSkipConflictCheck] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<"weekly" | "biweekly">("weekly");
  const [recurrenceCount, setRecurrenceCount] = useState(4);

  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successDetail, setSuccessDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(false);
    setSuccessDetail(null);
    setDate(defaultDate ?? DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd"));
    const biz = resolveDefaultBusiness(defaultBusiness, schedulerMode);
    setBusiness(biz);
    const d = schedulerDefaultsFromBusiness(biz, { schedulerMode });
    setLocationId(d.locationId);
    setServiceLine(d.serviceLine);
    setPatientBusinessTag(businessTagFromSchedulerBusiness(biz));
  }, [open, defaultDate, defaultBusiness, schedulerMode]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/admin/scheduler-services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        services?: { id: string; name: string; durationMinutes: number; active: boolean }[];
      };
      setSchedulerServices(
        (data.services ?? []).filter((s) => s.active).map((s) => ({
          id: s.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
        })),
      );
    })();
  }, [open, getIdToken]);

  useEffect(() => {
    if (!open) return;
    const d = schedulerDefaultsFromBusiness(business, { schedulerMode });
    setLocationId(d.locationId);
    setServiceLine(d.serviceLine);
    setPatientBusinessTag(businessTagFromSchedulerBusiness(business));
  }, [business, schedulerMode, open]);

  useEffect(() => {
    if (!open || patientSearch.trim().length < 2) {
      setPatientHits([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch(
          `/api/admin/patients?search=${encodeURIComponent(patientSearch.trim())}&limit=12`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { patients?: PatientApiRow[] };
        setPatientHits(data.patients ?? []);
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [open, patientSearch, getIdToken]);

  const endTimeLabel = useMemo(() => {
    const startDt = DateTime.fromISO(`${date}T${time}`, { zone: TIME_ZONE });
    if (!startDt.isValid) return "—";
    return startDt.plus({ minutes: durationMin }).toFormat("h:mm a");
  }, [date, time, durationMin]);

  const filteredProviders = useMemo(
    () =>
      providers
        .filter(
          (p) =>
            p.active &&
            p.locationIds.includes(locationId) &&
            p.serviceLines.includes(serviceLine) &&
            providerMatchesSchedulerBusiness(p, business),
        )
        .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName)),
    [providers, locationId, serviceLine, business],
  );

  const emptyProviderMessage = useMemo(() => {
    const loc = LOCATION_LABELS[locationId];
    const svc = SERVICE_LINE_LABELS[serviceLine];
    return `No providers match ${SCHEDULER_BUSINESS_LABELS[business]} (${loc}, ${svc}). Check Superadmin → Who patients can book, or change Business above.`;
  }, [business, locationId, serviceLine]);

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

      const payload: Record<string, unknown> = {
        locationId,
        serviceLine,
        ...(schedulerServiceId ? { schedulerServiceId } : { durationMin }),
        startIso,
        providerId: provider.id,
        providerDisplayName: provider.displayName,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
        skipConflictCheck,
        sendFirstTimeNotification,
        patientBusinessTag,
      };
      if (recurring && recurrenceCount > 1) {
        payload.recurrence = { frequency: recurrenceFreq, count: recurrenceCount };
      }

      const res = await fetch("/api/admin/bookings/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        totalCreated?: number;
        conflictsMessage?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Failed to create appointment.");
        return;
      }

      setSuccess(true);
      if (data.totalCreated && data.totalCreated > 1) {
        const detail = data.conflictsMessage
          ? `Created ${data.totalCreated} appointments. ${data.conflictsMessage}`
          : `Created ${data.totalCreated} recurring appointments.`;
        setSuccessDetail(detail);
      }
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
                <span className="text-xs font-medium text-slate-700">Service type</span>
                <select
                  value={schedulerServiceId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSchedulerServiceId(id);
                    const svc = schedulerServices.find((s) => s.id === id);
                    if (svc) setDurationMin(svc.durationMinutes);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Custom duration…</option>
                  {schedulerServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </label>
              {!schedulerServiceId ? (
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700">Duration</span>
                  <div className="flex flex-wrap gap-2">
                    {([30, 60, 90, 120] as const).map((d) => (
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
              ) : (
                <p className="text-xs text-slate-600">Duration: {durationMin} minutes (from service type)</p>
              )}
              <p className="text-xs text-slate-600">
                End time: <strong>{endTimeLabel}</strong> (Chicago)
              </p>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Business & provider
              </legend>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700">Business</span>
                <select
                  value={business}
                  onChange={(e) => setBusiness(e.target.value as Exclude<SchedulerBusinessId, "all">)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="rub_club">{SCHEDULER_BUSINESS_LABELS.rub_club}</option>
                  <option value="paris_chiro">{SCHEDULER_BUSINESS_LABELS.paris_chiro}</option>
                  <option value="sulphur_springs">{SCHEDULER_BUSINESS_LABELS.sulphur_springs}</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700">Provider</span>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {filteredProviders.length === 0 ? (
                    <option value="">{emptyProviderMessage}</option>
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

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Patient
              </legend>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700">Search existing</span>
                <input
                  type="search"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Name or phone…"
                />
              </label>
              {patientHits.length > 0 ? (
                <ul className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 text-sm">
                  {patientHits.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-white"
                        onClick={() => {
                          setName(`${p.firstName} ${p.lastName}`.trim());
                          setPhone(p.phone);
                          setEmail(p.email);
                          if (p.businessTag) setPatientBusinessTag(p.businessTag);
                          setPatientSearch("");
                          setPatientHits([]);
                        }}
                      >
                        {p.firstName} {p.lastName} · {p.phone}
                        {p.businessTag ? ` · ${p.businessTag}` : ""}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700">Patient business tag</span>
                <select
                  value={patientBusinessTag}
                  onChange={(e) => setPatientBusinessTag(e.target.value as PatientBusinessTag)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="rub_club">Rub Club</option>
                  <option value="chiro">Chiro</option>
                  <option value="both">Both</option>
                </select>
              </label>
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
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={sendFirstTimeNotification}
                  onChange={(e) => setSendFirstTimeNotification(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Send first-time confirmation text (when phone provided)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Recurring appointment
              </label>
              {recurring ? (
                <div className="ml-6 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-1 text-sm">
                      <span className="text-xs font-medium text-slate-700">Frequency</span>
                      <select
                        value={recurrenceFreq}
                        onChange={(e) => setRecurrenceFreq(e.target.value as "weekly" | "biweekly")}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Every 2 weeks</option>
                      </select>
                    </label>
                    <label className="block space-y-1 text-sm">
                      <span className="text-xs font-medium text-slate-700">Occurrences</span>
                      <select
                        value={recurrenceCount}
                        onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        {Array.from({ length: 25 }, (_, i) => i + 2).map((n) => (
                          <option key={n} value={n}>
                            {n} appointments
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">
                    Creates {recurrenceCount} appointments, same day/time,{" "}
                    {recurrenceFreq === "weekly" ? "every week" : "every 2 weeks"}.
                    Dates with conflicts will be skipped.
                  </p>
                </div>
              ) : null}
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
                {successDetail ?? "Appointment created successfully."}
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
