"use client";

import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { LOCATIONS, TIME_ZONE, type DurationMin, type LocationId, type ServiceLine } from "@/lib/constants";

type Slot = { startIso: string; label: string };

function todayIso(): string {
  return DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd");
}

function addDaysIso(days: number): string {
  return DateTime.now().setZone(TIME_ZONE).plus({ days }).toFormat("yyyy-LL-dd");
}

export function BookingWizard() {
  const [locationId, setLocationId] = useState<LocationId>("paris");
  const [serviceLine, setServiceLine] = useState<ServiceLine>("massage");
  const [durationMin, setDurationMin] = useState<DurationMin>(30);
  const [date, setDate] = useState<string>(todayIso());
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const minDate = useMemo(() => todayIso(), []);
  const maxDate = useMemo(() => addDaysIso(90), []);

  async function loadSlots() {
    setSlotsError(null);
    setSlots(null);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const qs = new URLSearchParams({
        locationId,
        date,
        durationMin: String(durationMin),
      });
      const res = await fetch(`/api/slots?${qs.toString()}`, { method: "GET" });
      if (!res.ok) throw new Error("Could not load times");
      const data = (await res.json()) as { slots: Slot[] };
      setSlots(data.slots);
      if (data.slots.length === 0) {
        setSlotsError("No open times that day. Try another date or duration.");
      }
    } catch {
      setSlotsError("Could not load times. Please try again.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function submitBooking() {
    setSubmitMessage(null);
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locationId,
          serviceLine,
          durationMin,
          startIso: selectedSlot.startIso,
          name,
          phone,
          email,
          notes,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setSubmitMessage(
          "That time was just taken. Please pick another slot and submit again.",
        );
        await loadSlots();
        return;
      }
      if (!res.ok) {
        setSubmitMessage(
          typeof data.error === "string" ? data.error : "Could not book. Try again.",
        );
        return;
      }
      setSubmitMessage(
        "Request received. The office will follow up to confirm. If this is urgent, please call the location directly.",
      );
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setSelectedSlot(null);
      setSlots(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Book an appointment</h1>
        <p className="text-slate-600">
          Pick a location, service type, and time. This form only schedules a request—no insurance or
          medical records are collected here.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-800">Location</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value as LocationId)}
            >
              <option value="paris">{LOCATIONS.paris.name}</option>
              <option value="sulphur_springs">{LOCATIONS.sulphur_springs.name}</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-800">Service</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={serviceLine}
              onChange={(e) => setServiceLine(e.target.value as ServiceLine)}
            >
              <option value="massage">Massage therapy</option>
              <option value="chiropractic">Chiropractic</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-800">Duration</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value) as DurationMin)}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-800">Date ({TIME_ZONE})</span>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          onClick={loadSlots}
          disabled={loadingSlots}
        >
          {loadingSlots ? "Loading times…" : "See open times"}
        </button>

        {slotsError ? <p className="text-sm text-red-700">{slotsError}</p> : null}

        {slots && slots.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">Available start times</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.startIso}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedSlot?.startIso === s.startIso
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 hover:border-slate-400"
                  }`}
                  onClick={() => setSelectedSlot(s)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Your contact details</h2>

        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-800">Full name</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-800">Phone</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-800">Email</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-800">Notes (optional)</span>
            <textarea
              className="min-h-[96px] w-full rounded-lg border border-slate-300 px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          disabled={!selectedSlot || submitting || !name || !phone || !email}
          onClick={submitBooking}
        >
          {submitting ? "Submitting…" : "Submit booking request"}
        </button>

        {submitMessage ? (
          <p className="text-sm text-slate-700" role="status">
            {submitMessage}
          </p>
        ) : null}
      </section>
    </div>
  );
}
