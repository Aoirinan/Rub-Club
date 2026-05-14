"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import {
  LOCATIONS,
  TIME_ZONE,
  type DurationMin,
  type LocationId,
  type ServiceLine,
} from "@/lib/constants";
import { track } from "@/lib/analytics";

type Slot = { startIso: string; label: string };

type ProviderOption = { id: string; displayName: string; sortOrder: number };

type ProviderMode = "specific" | "any";

function todayIso(): string {
  return DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd");
}

function addDaysIso(days: number): string {
  return DateTime.now().setZone(TIME_ZONE).plus({ days }).toFormat("yyyy-LL-dd");
}

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function readInitialLocation(value: string | null): LocationId {
  return value === "sulphur_springs" || value === "sulphur-springs"
    ? "sulphur_springs"
    : "paris";
}
function readInitialService(value: string | null): ServiceLine {
  return value === "chiropractic" ? "chiropractic" : "massage";
}
function readInitialDuration(value: string | null): DurationMin {
  return value === "60" ? 60 : 30;
}

export type BookingWizardInitial = {
  location?: string | null;
  service?: string | null;
  duration?: string | null;
  date?: string | null;
};

export function BookingWizard({ initial }: { initial?: BookingWizardInitial } = {}) {
  const [locationId, setLocationId] = useState<LocationId>(
    readInitialLocation(initial?.location ?? null),
  );
  const [serviceLine, setServiceLine] = useState<ServiceLine>(
    readInitialService(initial?.service ?? null),
  );
  const [durationMin, setDurationMin] = useState<DurationMin>(
    readInitialDuration(initial?.duration ?? null),
  );
  const [date, setDate] = useState<string>(initial?.date || todayIso());

  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotsHint, setSlotsHint] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [providers, setProviders] = useState<ProviderOption[] | null>(null);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const [providerMode, setProviderMode] = useState<ProviderMode>("any");
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
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [repeatWeeklyCount, setRepeatWeeklyCount] = useState(1);

  const minDate = useMemo(() => todayIso(), []);
  const maxDate = useMemo(() => addDaysIso(90), []);

  useEffect(() => {
    track("booking_started", {
      service: serviceLine,
      location: locationId,
      duration: durationMin,
    });
  }, [serviceLine, locationId, durationMin]);

  useEffect(() => {
    let cancelled = false;
    async function loadProviders() {
      setProvidersError(null);
      setProviders(null);
      try {
        const qs = new URLSearchParams({ locationId, serviceLine });
        const res = await fetch(`/api/providers?${qs.toString()}`, { cache: "no-store" });
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
    track("slots_view_requested", {
      service: serviceLine,
      location: locationId,
      duration: durationMin,
      date,
      providerMode,
    });
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
      const res = await fetch(`/api/slots?${qs.toString()}`, { method: "GET", cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        slots?: Slot[];
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Could not load times");
      }
      setSlots(data.slots ?? []);
      track("slots_viewed", {
        count: (data.slots ?? []).length,
      });
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
    setSubmitSuccess(false);
    if (!selectedSlot) return;
    if (providerMode === "specific" && !selectedProviderId) return;

    setSubmitting(true);
    track("booking_submitted", {
      service: serviceLine,
      location: locationId,
      duration: durationMin,
      providerMode,
    });
    try {
      const body: Record<string, unknown> = {
        locationId,
        serviceLine,
        durationMin,
        startIso: selectedSlot.startIso,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
        website,
        providerMode,
      };
      if (providerMode === "specific") {
        body.providerId = selectedProviderId;
      }
      if (providerMode === "specific" && repeatWeeklyCount > 1) {
        body.recurrence = { frequency: "weekly", count: repeatWeeklyCount };
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
        totalCreated?: number;
        conflictsMessage?: string;
      };
      if (res.status === 409) {
        setSubmitMessage(
          "That time was just taken by someone else. We refreshed the slots — pick a new time and submit again.",
        );
        track("booking_conflict", { service: serviceLine });
        await loadSlots();
        return;
      }
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Could not book. Try again.";
        setSubmitMessage(msg);
        track("booking_failed", { error: msg });
        return;
      }
      const who =
        data.providerMode === "any" && data.providerDisplayName
          ? ` First available slot held with ${data.providerDisplayName} (subject to office confirmation).`
          : data.providerDisplayName
            ? ` Requested with ${data.providerDisplayName}.`
            : "";
      const repeat =
        typeof data.totalCreated === "number" && data.totalCreated > 1
          ? ` ${data.totalCreated} recurring weekly visits were submitted (each pending office confirmation).`
          : "";
      const conflict = data.conflictsMessage ? ` ${data.conflictsMessage}` : "";
      setSubmitSuccess(true);
      setSubmitMessage(
        `Request received.${who}${repeat}${conflict} You will receive a confirmation email shortly — check spam if you don't see it. The office will follow up to confirm.`,
      );
      track("booking_succeeded", {
        service: serviceLine,
        location: locationId,
        duration: durationMin,
      });
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setRepeatWeeklyCount(1);
      setSelectedSlot(null);
      setSlots(null);
    } finally {
      setSubmitting(false);
    }
  }

  const canPickSlots = Boolean(providers?.length);
  const providerSelectDisabled = !providers?.length;
  const loc = LOCATIONS[locationId];

  const stepDone = {
    one: Boolean(locationId && serviceLine && durationMin && date),
    two: Boolean(selectedSlot),
    three: Boolean(name.trim() && phone.trim() && email.trim()),
  };

  return (
    <div className="bg-[#f4f2ea]">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
        <header className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0f5f5c]">
            Online Scheduling
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#173f3b] sm:text-4xl">
            Book an appointment
          </h1>
          <p className="mt-3 text-stone-700">
            Pick a location, service, time, and we&rsquo;ll send you an email confirmation with an
            add-to-calendar attachment. The office will follow up to finalize your appointment.
          </p>
          <ol className="mt-5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
            <li
              className={`rounded-full px-3 py-1 ${stepDone.one ? "bg-[#0f5f5c] text-white" : "bg-stone-200 text-stone-600"}`}
            >
              1. Service &amp; time
            </li>
            <li
              className={`rounded-full px-3 py-1 ${stepDone.two ? "bg-[#0f5f5c] text-white" : "bg-stone-200 text-stone-600"}`}
            >
              2. Pick a slot
            </li>
            <li
              className={`rounded-full px-3 py-1 ${stepDone.three ? "bg-[#0f5f5c] text-white" : "bg-stone-200 text-stone-600"}`}
            >
              3. Your details
            </li>
          </ol>
        </header>

        <section
          aria-labelledby="step-one"
          className="space-y-5 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md"
        >
          <h2 id="step-one" className="text-lg font-black text-[#173f3b]">
            What, where, and when
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-bold text-[#173f3b]">Location</span>
              <select
                className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value as LocationId);
                  setSelectedProviderId("");
                  setPreferredProviderId("");
                  setSlots(null);
                  setSelectedSlot(null);
                  setSlotsError(null);
                  setSlotsHint(null);
                }}
              >
                <option value="paris">{LOCATIONS.paris.name}</option>
                <option value="sulphur_springs">{LOCATIONS.sulphur_springs.name}</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-bold text-[#173f3b]">Service</span>
              <select
                className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
                value={serviceLine}
                onChange={(e) => {
                  const value = e.target.value as ServiceLine;
                  setServiceLine(value);
                  setSelectedSlot(null);
                  setSlots(null);
                  track("service_selected", { service: value });
                }}
              >
                <option value="massage">Massage therapy</option>
                <option value="chiropractic">Chiropractic</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-bold text-[#173f3b]">Duration</span>
              <select
                className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
                value={durationMin}
                onChange={(e) => {
                  setDurationMin(Number(e.target.value) as DurationMin);
                  setSelectedSlot(null);
                  setSlots(null);
                }}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-bold text-[#173f3b]">Date ({TIME_ZONE})</span>
              <input
                type="date"
                className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
                min={minDate}
                max={maxDate}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedSlot(null);
                  setSlots(null);
                }}
              />
            </label>
          </div>

          <div className="space-y-3 border border-stone-200 bg-[#f2efe3] p-4">
            <p className="text-sm font-black uppercase tracking-wide text-[#173f3b]">Provider</p>
            {providers === null ? (
              <p className="text-sm text-stone-700">Loading providers&hellip;</p>
            ) : providersError ? (
              <p className="text-sm text-red-700">{providersError}</p>
            ) : providers.length === 0 ? (
              <p className="text-sm text-amber-900">
                No providers are published for this location and service yet. Please call{" "}
                <a className="font-bold underline" href={`tel:${loc.phonePrimary.replaceAll("-", "")}`}>
                  {loc.phonePrimary}
                </a>{" "}
                to schedule.
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
                      checked={providerMode === "any"}
                      onChange={() => {
                        setProviderMode("any");
                        setRepeatWeeklyCount(1);
                        setSlots(null);
                        setSelectedSlot(null);
                      }}
                    />
                    <span>
                      <span className="font-bold text-[#173f3b]">First available</span>
                      <span className="block text-stone-700">
                        Show every time someone qualified is free. Recommended.
                      </span>
                    </span>
                  </label>
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
                      <span className="font-bold text-[#173f3b]">A specific provider</span>
                      <span className="block text-stone-700">Show only their openings.</span>
                    </span>
                  </label>
                </fieldset>

                {providerMode === "specific" ? (
                  <>
                    <label className="block space-y-1 text-sm">
                      <span className="font-bold text-[#173f3b]">Provider</span>
                      <select
                        className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
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
                    <label className="block space-y-1 text-sm">
                      <span className="font-bold text-[#173f3b]">Repeat (same weekday)</span>
                      <select
                        className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
                        value={repeatWeeklyCount}
                        onChange={(e) => setRepeatWeeklyCount(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>
                            {n === 1 ? "One visit only" : `${n} weekly visits (same weekday)`}
                          </option>
                        ))}
                      </select>
                      <span className="block text-xs text-stone-600">
                        Each visit is a separate pending request until the office confirms.
                      </span>
                    </label>
                  </>
                ) : (
                  <label className="block space-y-1 text-sm">
                    <span className="font-bold text-[#173f3b]">Preference (optional)</span>
                    <select
                      className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
                      value={preferredProviderId}
                      onChange={(e) => setPreferredProviderId(e.target.value)}
                    >
                      <option value="">No preference — truly first available</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          Prefer {p.displayName} if available (not guaranteed)
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
            className="focus-ring bg-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b] disabled:opacity-50"
            onClick={loadSlots}
            disabled={loadingSlots || !canPickSlots}
          >
            {loadingSlots ? "Loading times…" : "See open times"}
          </button>

          <div aria-live="polite" aria-busy={loadingSlots} className="space-y-3">
            {slotsHint ? <p className="text-sm text-stone-700">{slotsHint}</p> : null}
            {slotsError ? <p className="text-sm text-red-700">{slotsError}</p> : null}

            {slots && slots.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-wide text-[#173f3b]">
                  Available start times
                </p>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s.startIso}
                      className={`focus-ring min-h-[48px] rounded-xl border px-3 py-2 text-left text-sm transition ${
                        selectedSlot?.startIso === s.startIso
                          ? "border-[#0f5f5c] bg-[#0f5f5c] font-bold text-white"
                          : "border-stone-200 bg-stone-50 hover:border-[#0f5f5c]"
                      }`}
                      onClick={() => {
                        setSelectedSlot(s);
                        track("slot_selected", { startIso: s.startIso });
                      }}
                      aria-pressed={selectedSlot?.startIso === s.startIso}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {selectedSlot ? (
          <aside className="sticky top-24 z-10 border border-[#0f5f5c]/30 bg-[#eaf4f2] px-4 py-3 text-sm shadow-sm">
            <span className="font-bold text-[#173f3b]">Selected: </span>
            <span className="text-[#173f3b]">{selectedSlot.label}</span>
            <span className="ml-2 text-stone-600">
              · {durationMin} min · {serviceLine === "massage" ? "Massage" : "Chiropractic"} · {loc.shortName}
            </span>
          </aside>
        ) : null}

        <section
          aria-labelledby="step-three"
          className="space-y-4 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md"
        >
          <h2 id="step-three" className="text-lg font-black text-[#173f3b]">
            Your contact details
          </h2>

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
                className="focus-ring w-full border border-stone-300 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-bold text-[#173f3b]">Phone</span>
              <input
                className="focus-ring w-full border border-stone-300 px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                autoComplete="tel"
                inputMode="tel"
                placeholder="903-555-1234"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-bold text-[#173f3b]">Email</span>
              <input
                type="email"
                className="focus-ring w-full border border-stone-300 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                required
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-bold text-[#173f3b]">Notes (optional)</span>
              <textarea
                className="focus-ring min-h-[96px] w-full border border-stone-300 px-3 py-2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything we should know? Reason for visit, allergies, pregnancy, etc."
              />
            </label>
          </div>

          <p className="text-xs text-stone-600">
            We only collect your contact details and visit preferences. No insurance or medical
            records are stored here. By submitting you agree to be contacted about your appointment.
          </p>

          <button
            type="button"
            className="focus-ring bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d] disabled:opacity-50"
            disabled={!selectedSlot || submitting || !name || !phone || !email || !canPickSlots}
            onClick={submitBooking}
          >
            {submitting ? "Submitting…" : "Submit booking request"}
          </button>

          {submitMessage ? (
            <p
              className={`rounded border px-3 py-2 text-sm ${
                submitSuccess
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
              role="status"
              aria-live="polite"
            >
              {submitMessage}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
