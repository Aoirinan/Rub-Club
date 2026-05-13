"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { LOCATIONS, TIME_ZONE, type DurationMin, type LocationId, type ServiceLine } from "@/lib/constants";

type Slot = { startIso: string; label: string };

type ProviderOption = { id: string; displayName: string; sortOrder: number };

type ProviderMode = "specific" | "any";

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
  const [slotsHint, setSlotsHint] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [providers, setProviders] = useState<ProviderOption[] | null>(null);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const [providerMode, setProviderMode] = useState<ProviderMode>("specific");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [preferredProviderId, setPreferredProviderId] = useState("");

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

  useEffect(() => {
    let cancelled = false;
    async function loadProviders() {
      setProvidersError(null);
      setProviders(null);
      try {
        const qs = new URLSearchParams({ locationId, serviceLine });
        const res = await fetch(`/api/providers?${qs.toString()}`);
        const data = (await res.json()) as { providers?: ProviderOption[]; error?: string };
        if (!res.ok) throw new Error(data.error || "Could not load providers");
        const list = data.providers ?? [];
        if (cancelled) return;
        setProviders(list);
        setSelectedProviderId((prev) => (list.some((p) => p.id === prev) ? prev : list[0]?.id ?? ""));
        setPreferredProviderId((prev) => (prev && list.some((p) => p.id === prev) ? prev : ""));
      } catch (e) {
        if (!cancelled) {
          setProvidersError(e instanceof Error ? e.message : "Could not load providers.");
          setProviders([]);
        }
      }
    }
    void loadProviders();
    return () => {
      cancelled = true;
    };
  }, [locationId, serviceLine]);

  async function loadSlots() {
    setSlotsError(null);
    setSlotsHint(null);
    setSlots(null);
    setSelectedSlot(null);
    if (!providers?.length) {
      setSlotsError("No bookable providers for this location and service yet. Please call the office.");
      return;
    }
    if (providerMode === "specific" && !selectedProviderId) {
      setSlotsError("Choose a provider first.");
      return;
    }
    setLoadingSlots(true);
    try {
      const qs = new URLSearchParams({
        locationId,
        date,
        durationMin: String(durationMin),
        serviceLine,
        providerMode,
      });
      if (providerMode === "specific") {
        qs.set("providerId", selectedProviderId);
      }
      const res = await fetch(`/api/slots?${qs.toString()}`, { method: "GET" });
      const data = (await res.json().catch(() => ({}))) as {
        slots?: Slot[];
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Could not load times");
      }
      setSlots(data.slots ?? []);
      if ((data.slots ?? []).length === 0) {
        setSlotsError("No open times that day. Try another date, duration, or provider option.");
      }
      if (typeof data.message === "string" && data.message.length > 0) {
        setSlotsHint(data.message);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load times. Please try again.";
      setSlotsError(msg);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function submitBooking() {
    setSubmitMessage(null);
    if (!selectedSlot) return;
    if (providerMode === "specific" && !selectedProviderId) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        locationId,
        serviceLine,
        durationMin,
        startIso: selectedSlot.startIso,
        name,
        phone,
        email,
        notes,
        website,
        providerMode,
      };
      if (providerMode === "specific") {
        body.providerId = selectedProviderId;
      }
      if (providerMode === "any" && preferredProviderId) {
        body.preferredProviderId = preferredProviderId;
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        providerDisplayName?: string;
        providerMode?: ProviderMode;
      };
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
      const who =
        data.providerMode === "any" && data.providerDisplayName
          ? ` First available slot held with ${data.providerDisplayName} (subject to office confirmation).`
          : data.providerDisplayName
            ? ` Requested with ${data.providerDisplayName}.`
            : "";
      setSubmitMessage(
        `Request received.${who} The office will follow up to confirm. If this is urgent, please call the location directly.`,
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

  const canPickSlots = Boolean(providers?.length);
  const providerSelectDisabled = !providers?.length;

  return (
    <div className="bg-[#f4f2ea]">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <div className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0f5f5c]">Online Scheduling</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#173f3b]">Book an appointment</h1>
        <p className="mt-3 text-stone-700">
          Pick a location, service, provider option, and time. This form only schedules a request—no insurance or
          medical records are collected here.
        </p>
      </div>

      <section className="space-y-5 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Location</span>
            <select
              className="w-full border border-stone-300 bg-white px-3 py-2"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value as LocationId)}
            >
              <option value="paris">{LOCATIONS.paris.name}</option>
              <option value="sulphur_springs">{LOCATIONS.sulphur_springs.name}</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Service</span>
            <select
              className="w-full border border-stone-300 bg-white px-3 py-2"
              value={serviceLine}
              onChange={(e) => setServiceLine(e.target.value as ServiceLine)}
            >
              <option value="massage">Massage therapy</option>
              <option value="chiropractic">Chiropractic</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Duration</span>
            <select
              className="w-full border border-stone-300 bg-white px-3 py-2"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value) as DurationMin)}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Date ({TIME_ZONE})</span>
            <input
              type="date"
              className="w-full border border-stone-300 bg-white px-3 py-2"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        <div className="space-y-3 border border-stone-200 bg-[#f2efe3] p-4">
          <p className="text-sm font-black uppercase tracking-wide text-[#173f3b]">Provider</p>
          {providers === null ? (
            <p className="text-sm text-stone-700">Loading providers…</p>
          ) : providersError ? (
            <p className="text-sm text-red-700">{providersError}</p>
          ) : providers.length === 0 ? (
            <p className="text-sm text-amber-900">
              No providers are published for this location and service yet. Please call the office to schedule.
            </p>
          ) : (
            <>
              <fieldset className="space-y-2 text-sm">
                <legend className="sr-only">How to choose a provider</legend>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name="providerMode"
                    className="mt-1"
                    checked={providerMode === "specific"}
                    onChange={() => {
                      setProviderMode("specific");
                      setPreferredProviderId("");
                      setSlots(null);
                      setSelectedSlot(null);
                    }}
                  />
                  <span>
                    <span className="font-bold text-[#173f3b]">I want a specific provider</span>
                    <span className="block text-stone-700">Only their open times are shown.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name="providerMode"
                    className="mt-1"
                    checked={providerMode === "any"}
                    onChange={() => {
                      setProviderMode("any");
                      setSlots(null);
                      setSelectedSlot(null);
                    }}
                  />
                  <span>
                    <span className="font-bold text-[#173f3b]">First available for this service</span>
                    <span className="block text-stone-700">
                      Times when any qualified provider at this location is free. The next step lets you note a
                      preference; assignment is automatic and not guaranteed.
                    </span>
                  </span>
                </label>
              </fieldset>

              {providerMode === "specific" ? (
                <label className="block space-y-1 text-sm">
                  <span className="font-bold text-[#173f3b]">Provider</span>
                  <select
                    className="w-full border border-stone-300 bg-white px-3 py-2"
                    value={selectedProviderId}
                    onChange={(e) => {
                      setSelectedProviderId(e.target.value);
                      setSlots(null);
                      setSelectedSlot(null);
                    }}
                    disabled={providerSelectDisabled}
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="block space-y-1 text-sm">
                  <span className="font-bold text-[#173f3b]">Preference (optional)</span>
                  <select
                    className="w-full border border-stone-300 bg-white px-3 py-2"
                    value={preferredProviderId}
                    onChange={(e) => setPreferredProviderId(e.target.value)}
                  >
                    <option value="">No preference — truly first available</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        Prefer {p.displayName} if they have this slot (not guaranteed)
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          className="bg-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b] disabled:opacity-50"
          onClick={loadSlots}
          disabled={loadingSlots || !canPickSlots}
        >
          {loadingSlots ? "Loading times…" : "See open times"}
        </button>

        {slotsHint ? <p className="text-sm text-stone-700">{slotsHint}</p> : null}
        {slotsError ? <p className="text-sm text-red-700">{slotsError}</p> : null}

        {slots && slots.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-wide text-[#173f3b]">Available start times</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.startIso}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedSlot?.startIso === s.startIso
                      ? "border-[#0f5f5c] bg-[#0f5f5c] text-white"
                      : "border-stone-200 bg-stone-50 hover:border-[#0f5f5c]"
                  }`}
                  onClick={() => setSelectedSlot(s)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {selectedSlot ? (
              <p className="text-sm text-stone-700">
                <span className="font-bold text-[#173f3b]">Selected time: </span>
                {selectedSlot.label}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="space-y-4 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md">
        <h2 className="text-lg font-black text-[#173f3b]">Your contact details</h2>

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
            <span className="font-bold text-[#173f3b]">Full name</span>
            <input
              className="w-full border border-stone-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Phone</span>
            <input
              className="w-full border border-stone-300 px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Email</span>
            <input
              className="w-full border border-stone-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-bold text-[#173f3b]">Notes (optional)</span>
            <textarea
              className="min-h-[96px] w-full border border-stone-300 px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          className="bg-[#f2d25d] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d] disabled:opacity-50"
          disabled={!selectedSlot || submitting || !name || !phone || !email || !canPickSlots}
          onClick={submitBooking}
        >
          {submitting ? "Submitting…" : "Submit booking request"}
        </button>

        {submitMessage ? (
          <p className="text-sm text-stone-700" role="status">
            {submitMessage}
          </p>
        ) : null}
      </section>
      </div>
    </div>
  );
}
