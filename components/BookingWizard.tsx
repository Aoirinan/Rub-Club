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

type ProviderOption = {
  id: string;
  displayName: string;
  sortOrder: number;
  photoUrl?: string | null;
  about?: string | null;
};

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
  const [squarePayUrl, setSquarePayUrl] = useState<string | null>(null);
  const [repeatWeeklyCount, setRepeatWeeklyCount] = useState(1);

  const selectedProvider = useMemo(
    () => (providers && selectedProviderId ? providers.find((p) => p.id === selectedProviderId) ?? null : null),
    [providers, selectedProviderId],
  );
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
    setSquarePayUrl(null);
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
        paymentUrl?: string;
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
      if (typeof data.paymentUrl === "string" && data.paymentUrl.length > 0) {
        setSquarePayUrl(data.paymentUrl);
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
      const tail = data.paymentUrl
        ? " Use the secure Square link below to pay for this time. After checkout you will receive a receipt and a confirmed appointment email with a calendar attachment."
        : " You will receive a confirmation email shortly — check spam if you don't see it. The office will follow up to confirm.";
      setSubmitSuccess(true);
      setSubmitMessage(`Request received.${who}${repeat}${conflict} ${tail}`);
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
  const loc = LOCATIONS[locationId];

  const stepDone = {
    one: Boolean(locationId && serviceLine && durationMin && date),
    two: Boolean(selectedSlot),
    three: Boolean(name.trim() && phone.trim() && email.trim()),
  };

  const fieldLabel = "block text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#0f5f5c]";
  const fieldControl =
    "focus-ring w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm transition placeholder:text-stone-400 hover:border-stone-400";

  return (
    <div className="min-h-screen bg-[#f4f2ea]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8 sm:p-10">
          <div className="border-l-4 border-[#0f5f5c] pl-4 sm:pl-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0f5f5c] sm:text-sm">
              Online scheduling
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#173f3b] sm:text-4xl md:text-[2.5rem] md:leading-tight">
              Book an appointment
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
              Choose your visit, see real openings, then send your request. We&rsquo;ll email you next
              steps; when online payment is enabled, you&rsquo;ll be able to check out on Square right
              after you submit.
            </p>
          </div>
          <ol className="mt-8 flex flex-col gap-2 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            {(
              [
                { n: 1, label: "Service & time", done: stepDone.one },
                { n: 2, label: "Pick a slot", done: stepDone.two },
                { n: 3, label: "Your details", done: stepDone.three },
              ] as const
            ).map((step) => (
              <li
                key={step.n}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wide transition sm:text-[0.7rem] ${
                  step.done
                    ? "border-[#0f5f5c]/40 bg-[#0f5f5c] text-white shadow-sm"
                    : "border-stone-200 bg-stone-50 text-stone-500"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-black ${
                    step.done ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {step.n}
                </span>
                {step.label}
              </li>
            ))}
          </ol>
        </header>

        <div
          className={`mt-8 sm:mt-10 ${selectedSlot ? "lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,300px)] lg:items-start lg:gap-10 xl:gap-12" : ""}`}
        >
          <div className="min-w-0 space-y-8 sm:space-y-10">
            <section
              aria-labelledby="step-one"
              className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex flex-col gap-1 border-b border-stone-100 pb-5 sm:pb-6">
                <h2 id="step-one" className="text-xl font-black text-[#173f3b] sm:text-2xl">
                  What, where, and when
                </h2>
                <p className="text-sm text-stone-600">Set the basics, then choose how you want to match with a provider.</p>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className={fieldLabel}>Location</span>
              <select
                className={fieldControl}
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

            <label className="block space-y-1.5 text-sm">
              <span className={fieldLabel}>Service</span>
              <select
                className={fieldControl}
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

            <label className="block space-y-1.5 text-sm">
              <span className={fieldLabel}>Duration</span>
              <select
                className={fieldControl}
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

            <label className="block space-y-1.5 text-sm">
              <span className={fieldLabel}>Date ({TIME_ZONE})</span>
              <input
                type="date"
                className={fieldControl}
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

          <div className="mt-8 space-y-5 rounded-2xl border border-stone-200/80 bg-gradient-to-b from-[#faf8f3] to-[#f0ebe0] p-5 shadow-inner sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={fieldLabel}>Provider matching</p>
                <p className="mt-1 text-base font-black text-[#173f3b]">How should we match you?</p>
              </div>
            </div>
            {providers === null ? (
              <p className="text-sm text-stone-700">Loading providers&hellip;</p>
            ) : providersError ? (
              <p className="text-sm text-red-700">{providersError}</p>
            ) : providers.length === 0 ? (
              <p className="text-sm leading-relaxed text-amber-950">
                No providers are published for this location and service yet. Please call{" "}
                <a className="font-bold underline underline-offset-2" href={`tel:${loc.phonePrimary.replaceAll("-", "")}`}>
                  {loc.phonePrimary}
                </a>{" "}
                to schedule.
              </p>
            ) : (
              <>
                <fieldset>
                  <legend className="sr-only">How to choose a provider</legend>
                  <div className="flex flex-col gap-2 sm:inline-flex sm:flex-row sm:rounded-xl sm:border sm:border-stone-300 sm:bg-white sm:p-1 sm:shadow-sm">
                    <button
                      type="button"
                      className={`focus-ring rounded-lg px-4 py-3 text-left text-sm transition sm:py-2.5 ${
                        providerMode === "any"
                          ? "bg-[#0f5f5c] text-white shadow-sm sm:px-5"
                          : "bg-white text-stone-800 hover:bg-stone-50 sm:bg-transparent"
                      }`}
                      onClick={() => {
                        setProviderMode("any");
                        setRepeatWeeklyCount(1);
                        setSlots(null);
                        setSelectedSlot(null);
                      }}
                    >
                      <span className="font-bold">First available</span>
                      <span className="mt-0.5 block text-xs font-normal opacity-90 sm:opacity-100">
                        Earliest opening with any listed provider.
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`focus-ring rounded-lg px-4 py-3 text-left text-sm transition sm:py-2.5 ${
                        providerMode === "specific"
                          ? "bg-[#0f5f5c] text-white shadow-sm sm:px-5"
                          : "bg-white text-stone-800 hover:bg-stone-50 sm:bg-transparent"
                      }`}
                      onClick={() => {
                        setProviderMode("specific");
                        setPreferredProviderId("");
                        setSlots(null);
                        setSelectedSlot(null);
                      }}
                    >
                      <span className="font-bold">Choose a provider</span>
                      <span className="mt-0.5 block text-xs font-normal opacity-90 sm:opacity-100">
                        See their photo, bio, and only their openings.
                      </span>
                    </button>
                  </div>
                </fieldset>

                {providerMode === "specific" ? (
                  <>
                    <p className="text-xs leading-relaxed text-stone-600">
                      Listed providers accept new clients through online booking. Tap a card to select
                      them, then load open times below.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {providers.map((p) => {
                        const selected = selectedProviderId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className={`focus-ring group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${
                              selected
                                ? "border-[#0f5f5c] ring-2 ring-[#0f5f5c] ring-offset-2 ring-offset-white"
                                : "border-stone-200/90 hover:border-[#0f5f5c]/40 hover:shadow-md"
                            }`}
                            onClick={() => {
                              setSelectedProviderId(p.id);
                              setSlots(null);
                              setSelectedSlot(null);
                            }}
                            aria-pressed={selected}
                          >
                            <div className="relative aspect-[5/6] w-full overflow-hidden bg-gradient-to-b from-stone-100 to-stone-200">
                              {p.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.photoUrl}
                                  alt={p.displayName}
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-4xl font-black text-stone-400">
                                  {p.displayName.slice(0, 1)}
                                </div>
                              )}
                              {selected ? (
                                <span className="absolute right-2 top-2 rounded-full bg-[#0f5f5c] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white shadow">
                                  Selected
                                </span>
                              ) : null}
                            </div>
                            <div className="space-y-1.5 p-4">
                              <span className="block font-bold text-[#173f3b]">{p.displayName}</span>
                              {p.about ? (
                                <span className="line-clamp-2 block text-xs leading-snug text-stone-600">
                                  {p.about}
                                </span>
                              ) : (
                                <span className="block text-xs text-stone-500">Bio in panel below.</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {selectedProvider ? (
                      <div className="overflow-hidden rounded-2xl border border-[#0f5f5c]/20 bg-white shadow-sm">
                        <div className="border-b border-stone-100 bg-[#f0faf8] px-4 py-3 sm:px-5">
                          <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#0f5f5c]">
                            About this provider
                          </p>
                          <p className="mt-0.5 text-lg font-black text-[#173f3b]">{selectedProvider.displayName}</p>
                        </div>
                        <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
                          <div className="mx-auto w-full max-w-[200px] shrink-0 sm:mx-0 sm:max-w-[220px]">
                            {selectedProvider.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={selectedProvider.photoUrl}
                                alt={selectedProvider.displayName}
                                className="aspect-square w-full rounded-xl object-cover shadow-md"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 text-4xl font-black text-stone-500 shadow-inner">
                                {selectedProvider.displayName.slice(0, 1)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-relaxed text-stone-700 sm:text-[0.9375rem] sm:leading-relaxed">
                              {selectedProvider.about?.trim()
                                ? selectedProvider.about
                                : "We are adding a short bio for this provider soon. You can still choose them and pick an open time below."}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <label className="block space-y-1.5 text-sm">
                      <span className={fieldLabel}>Repeat (same weekday)</span>
                      <select
                        className={fieldControl}
                        value={repeatWeeklyCount}
                        onChange={(e) => setRepeatWeeklyCount(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>
                            {n === 1 ? "One visit only" : `${n} weekly visits (same weekday)`}
                          </option>
                        ))}
                      </select>
                      <span className="block text-xs leading-relaxed text-stone-600">
                        Each visit is a separate pending request until the office confirms.
                      </span>
                    </label>
                  </>
                ) : (
                  <label className="block space-y-1.5 text-sm">
                    <span className={fieldLabel}>Preference (optional)</span>
                    <select
                      className={fieldControl}
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

          <div className="mt-8 flex flex-col gap-4 border-t border-stone-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="focus-ring inline-flex w-full items-center justify-center rounded-xl bg-[#0f5f5c] px-6 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-[#0f817b] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
              onClick={loadSlots}
              disabled={loadingSlots || !canPickSlots}
            >
              {loadingSlots ? "Loading times…" : "See open times"}
            </button>
            {slots && slots.length > 0 ? (
              <p className="text-center text-xs text-stone-500 sm:text-left">
                {slots.length} opening{slots.length === 1 ? "" : "s"} loaded — tap a time to continue.
              </p>
            ) : null}
          </div>

          <div aria-live="polite" aria-busy={loadingSlots} className="mt-6 space-y-4">
            {slotsHint ? (
              <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                {slotsHint}
              </p>
            ) : null}
            {slotsError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{slotsError}</p>
            ) : null}

            {slots && slots.length > 0 ? (
              <div className="space-y-3">
                <p className={fieldLabel}>Available start times</p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s.startIso}
                      className={`focus-ring min-h-[52px] rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                        selectedSlot?.startIso === s.startIso
                          ? "border-[#0f5f5c] bg-[#0f5f5c] text-white shadow-md"
                          : "border-stone-200 bg-stone-50/90 text-[#173f3b] hover:border-[#0f5f5c]/50 hover:bg-white"
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

        <section
          aria-labelledby="step-three"
          className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="border-b border-stone-100 pb-5 sm:pb-6">
            <h2 id="step-three" className="text-xl font-black text-[#173f3b] sm:text-2xl">
              Your contact details
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              We&rsquo;ll use this to confirm your visit and send updates. Add anything helpful in notes.
            </p>
          </div>

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

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm sm:col-span-2">
              <span className={fieldLabel}>Full name</span>
              <input
                className={fieldControl}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className={fieldLabel}>Phone</span>
              <input
                className={fieldControl}
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                autoComplete="tel"
                inputMode="tel"
                placeholder="903-555-1234"
                required
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className={fieldLabel}>Email</span>
              <input
                type="email"
                className={fieldControl}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                required
              />
            </label>
            <label className="block space-y-1.5 text-sm sm:col-span-2">
              <span className={fieldLabel}>Notes (optional)</span>
              <textarea
                className={`${fieldControl} min-h-[100px] resize-y`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything we should know? Reason for visit, allergies, pregnancy, etc."
              />
            </label>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-stone-600">
            We only collect your contact details and visit preferences. No insurance or medical records
            are stored here. By submitting you agree to be contacted about your appointment.
          </p>

          <button
            type="button"
            className="focus-ring mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#f2d25d] px-6 py-3.5 text-sm font-black uppercase tracking-wide text-[#173f3b] shadow-sm transition hover:bg-[#e6c13d] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[240px]"
            disabled={!selectedSlot || submitting || !name || !phone || !email || !canPickSlots}
            onClick={submitBooking}
          >
            {submitting ? "Submitting…" : "Submit booking request"}
          </button>

          {submitMessage ? (
            <div
              className={`mt-6 space-y-4 rounded-xl border px-4 py-4 text-sm leading-relaxed sm:px-5 sm:py-5 ${
                submitSuccess
                  ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-950"
                  : "border-amber-200/80 bg-amber-50/90 text-amber-950"
              }`}
              role="status"
              aria-live="polite"
            >
              <p>{submitMessage}</p>
              {submitSuccess && squarePayUrl ? (
                <div className="flex flex-col gap-2 border-t border-emerald-200/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-900/90">
                    Secure checkout
                  </span>
                  <a
                    href={squarePayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring inline-flex w-full items-center justify-center rounded-xl bg-[#0f5f5c] px-5 py-3 text-center text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-[#0f817b] sm:w-auto"
                  >
                    Pay with Square (new tab)
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

        {selectedSlot ? (
          <aside className="mt-8 h-fit rounded-2xl border border-[#0f5f5c]/25 bg-gradient-to-b from-[#eaf6f4] to-[#e2f0ec] p-5 text-sm shadow-sm lg:sticky lg:top-24 lg:mt-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#0f5f5c]">Your selection</p>
            <p className="mt-2 text-lg font-black leading-snug text-[#173f3b]">{selectedSlot.label}</p>
            <dl className="mt-4 space-y-2 border-t border-[#0f5f5c]/10 pt-4 text-xs text-stone-700 sm:text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Duration</dt>
                <dd className="font-semibold text-[#173f3b]">{durationMin} min</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Service</dt>
                <dd className="font-semibold text-[#173f3b]">
                  {serviceLine === "massage" ? "Massage" : "Chiropractic"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Location</dt>
                <dd className="text-right font-semibold text-[#173f3b]">{loc.shortName}</dd>
              </div>
            </dl>
          </aside>
        ) : null}
      </div>
    </div>
    </div>
  );
}
