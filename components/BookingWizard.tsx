"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import {
  LOCATIONS,
  TIME_ZONE,
  telHref,
  type DurationMin,
  type LocationId,
  type LocationInfo,
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
function readInitialVisitKind(value: string | null): "massage" | "stretch" {
  return value === "stretch" ? "stretch" : "massage";
}
function readInitialDuration(value: string | null): DurationMin {
  return value === "60" ? 60 : 30;
}

export type BookingWizardInitial = {
  location?: string | null;
  service?: string | null;
  duration?: string | null;
  date?: string | null;
  /** When set (from server), phone labels match owner-configured numbers site-wide. */
  locations?: Record<LocationId, LocationInfo>;
};

export function BookingWizard({ initial }: { initial?: BookingWizardInitial } = {}) {
  const locById = initial?.locations ?? LOCATIONS;
  const serviceLine: ServiceLine = "massage";
  const [locationId, setLocationId] = useState<LocationId>(
    readInitialLocation(initial?.location ?? null),
  );
  const [visitKind, setVisitKind] = useState<"massage" | "stretch">(
    readInitialVisitKind(initial?.service ?? null),
  );
  const [payMode, setPayMode] = useState<"unset" | "cash" | "insurance">("unset");
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
      visitKind,
      location: locationId,
      duration: durationMin,
    });
  }, [visitKind, locationId, durationMin, serviceLine]);

  useEffect(() => {
    let cancelled = false;
    async function loadProviders() {
      if (payMode !== "cash") {
        setProvidersError(null);
        setProviders([]);
        return;
      }
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
  }, [locationId, payMode, serviceLine]);

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
      visitKind,
      location: locationId,
      duration: durationMin,
      providerMode,
    });
    try {
      const body: Record<string, unknown> = {
        locationId,
        serviceLine,
        visitKind,
        paymentType: "cash",
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

  const canPickSlots = Boolean(payMode === "cash" && providers?.length);
  const loc = locById[locationId];

  const stepDone = {
    one: Boolean(payMode === "cash" && locationId && durationMin && date),
    two: Boolean(selectedSlot),
    three: Boolean(name.trim() && phone.trim() && email.trim()),
  };

  const fieldLabel =
    "block text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#0f5f5c] sm:text-[0.65rem] sm:tracking-[0.12em]";
  /** 16px+ on small screens avoids iOS input zoom; 48px min height for comfortable taps. */
  const fieldControl =
    "touch-manipulation focus-ring w-full min-h-[48px] rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 shadow-sm transition placeholder:text-stone-400 hover:border-stone-400 sm:min-h-0 sm:rounded-lg sm:px-3 sm:py-2.5 sm:text-sm";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f2ea] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-6xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-8 sm:px-6 sm:py-14">
        <header className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-8 sm:p-10">
          <div className="border-l-4 border-[#0f5f5c] pl-3 sm:pl-5">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#0f5f5c] sm:text-sm sm:tracking-[0.2em]">
              Online scheduling
            </p>
            <h1 className="mt-2 text-[1.65rem] font-black leading-tight tracking-tight text-[#173f3b] min-[400px]:text-3xl sm:text-4xl md:text-[2.5rem] md:leading-tight">
              Book an appointment
            </h1>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-stone-600 sm:text-base">
              Choose your visit, see real openings, then send your request. We&rsquo;ll email you next
              steps; when online payment is enabled, you&rsquo;ll be able to check out on Square right
              after you submit.
            </p>
          </div>
          <ol className="mt-6 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pt-0.5 [-webkit-overflow-scrolling:touch] sm:mt-10 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {(
              [
                { n: 1, label: "Service & time", done: stepDone.one },
                { n: 2, label: "Pick a slot", done: stepDone.two },
                { n: 3, label: "Your details", done: stepDone.three },
              ] as const
            ).map((step) => (
              <li
                key={step.n}
                className={`flex min-h-[48px] shrink-0 snap-start items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[0.7rem] font-bold uppercase tracking-wide transition min-[400px]:text-xs sm:min-h-0 sm:px-3 sm:py-2 sm:text-[0.7rem] ${
                  step.done
                    ? "border-[#0f5f5c]/40 bg-[#0f5f5c] text-white shadow-sm"
                    : "border-stone-200 bg-stone-50 text-stone-500"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black sm:h-6 sm:w-6 sm:text-[0.7rem] ${
                    step.done ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {step.n}
                </span>
                <span className="whitespace-nowrap">{step.label}</span>
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
              className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm sm:p-8"
            >
              <div className="flex flex-col gap-1 border-b border-stone-100 pb-4 sm:pb-6">
                <h2 id="step-one" className="text-lg font-black leading-tight text-[#173f3b] sm:text-2xl">
                  What, where, and when
                </h2>
                <p className="text-[0.9375rem] leading-snug text-stone-600 sm:text-sm">
                  Set the basics, then choose how you want to match with a provider.
                </p>
              </div>

              <div className="mt-5 space-y-6 sm:mt-6">
                <div className="space-y-2">
                  <span className={fieldLabel}>Visit type</span>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className={`focus-ring min-h-[48px] flex-1 rounded-xl border px-4 py-3 text-sm font-bold ${
                        visitKind === "massage"
                          ? "border-[#0f5f5c] bg-[#0f5f5c] text-white"
                          : "border-stone-300 bg-white text-[#173f3b]"
                      }`}
                      onClick={() => {
                        setVisitKind("massage");
                        setSlots(null);
                        setSelectedSlot(null);
                      }}
                    >
                      Massage
                    </button>
                    <button
                      type="button"
                      className={`focus-ring min-h-[48px] flex-1 rounded-xl border px-4 py-3 text-sm font-bold ${
                        visitKind === "stretch"
                          ? "border-[#0f5f5c] bg-[#0f5f5c] text-white"
                          : "border-stone-300 bg-white text-[#173f3b]"
                      }`}
                      onClick={() => {
                        setVisitKind("stretch");
                        setSlots(null);
                        setSelectedSlot(null);
                      }}
                    >
                      Stretch
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-stone-600">
                    Stretch sessions are by appointment only. Walk-ins are welcome for massage when we have
                    availability.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className={fieldLabel}>How will you be paying?</span>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className={`focus-ring min-h-[48px] flex-1 rounded-xl border px-4 py-3 text-sm font-bold ${
                        payMode === "cash"
                          ? "border-[#0f5f5c] bg-[#0f5f5c] text-white"
                          : "border-stone-300 bg-white text-[#173f3b]"
                      }`}
                      onClick={() => {
                        setPayMode("cash");
                        setSlots(null);
                        setSelectedSlot(null);
                      }}
                    >
                      Cash / Debit Card
                    </button>
                    <button
                      type="button"
                      className={`focus-ring min-h-[48px] flex-1 rounded-xl border px-4 py-3 text-sm font-bold ${
                        payMode === "insurance"
                          ? "border-amber-600 bg-amber-600 text-white"
                          : "border-stone-300 bg-white text-[#173f3b]"
                      }`}
                      onClick={() => {
                        setPayMode("insurance");
                        setSlots(null);
                        setSelectedSlot(null);
                      }}
                    >
                      Insurance
                    </button>
                  </div>
                </div>

                {payMode === "insurance" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <p className="font-bold">Insurance patients please call us to book:</p>
                    <p className="mt-2">
                      Paris{" "}
                      <a className="font-bold underline" href={telHref(locById.paris.phonePrimary)}>
                        {locById.paris.phonePrimary}
                      </a>{" "}
                      | Sulphur Springs{" "}
                      <a className="font-bold underline" href={telHref(locById.sulphur_springs.phonePrimary)}>
                        {locById.sulphur_springs.phonePrimary}
                      </a>
                    </p>
                    <p className="mt-2 text-xs">
                      Chiropractic with insurance is not available through this online scheduler.
                    </p>
                  </div>
                ) : null}

                {payMode === "cash" ? (
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
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
                <option value="paris">{locById.paris.name}</option>
                <option value="sulphur_springs">{locById.sulphur_springs.name}</option>
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

            <label className="block space-y-1.5 text-sm sm:col-span-2">
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
                ) : null}
              </div>

          {payMode === "cash" ? (
          <>
          <div className="mt-6 space-y-4 rounded-2xl border border-stone-200/80 bg-gradient-to-b from-[#faf8f3] to-[#f0ebe0] p-4 shadow-inner sm:mt-8 sm:space-y-5 sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={fieldLabel}>Provider matching</p>
                <p className="mt-1 text-[1.05rem] font-black leading-snug text-[#173f3b] sm:text-base">
                  How should we match you?
                </p>
              </div>
            </div>
            {providers === null ? (
              <p className="text-sm text-stone-700">Loading providers&hellip;</p>
            ) : providersError ? (
              <p className="text-sm text-red-700">{providersError}</p>
            ) : providers.length === 0 ? (
              <p className="text-sm leading-relaxed text-amber-950">
                No providers are published for this location and service yet. Please call{" "}
                <a
                  className="inline-flex min-h-[44px] items-center font-bold underline underline-offset-2"
                  href={`tel:${loc.phonePrimary.replaceAll("-", "")}`}
                >
                  {loc.phonePrimary}
                </a>{" "}
                to schedule.
              </p>
            ) : (
              <>
                <fieldset>
                  <legend className="sr-only">How to choose a provider</legend>
                  <div className="flex flex-col gap-1.5 rounded-xl border border-stone-300 bg-white p-1 shadow-sm sm:inline-flex sm:flex-row sm:gap-0">
                    <button
                      type="button"
                      className={`focus-ring touch-manipulation min-h-[52px] rounded-lg px-4 py-3.5 text-left text-[0.9375rem] transition active:bg-stone-100 sm:min-h-0 sm:py-2.5 sm:text-sm ${
                        providerMode === "any"
                          ? "bg-[#0f5f5c] text-white shadow-sm sm:px-5"
                          : "text-stone-800 hover:bg-stone-50 sm:bg-transparent"
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
                      className={`focus-ring touch-manipulation min-h-[52px] rounded-lg px-4 py-3.5 text-left text-[0.9375rem] transition active:bg-stone-100 sm:min-h-0 sm:py-2.5 sm:text-sm ${
                        providerMode === "specific"
                          ? "bg-[#0f5f5c] text-white shadow-sm sm:px-5"
                          : "text-stone-800 hover:bg-stone-50 sm:bg-transparent"
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
                    <p className="text-[0.8125rem] leading-relaxed text-stone-600 sm:text-xs">
                      Listed providers accept new clients through online booking. Choose a provider from
                      the list, then load open times below.
                    </p>
                    <label className="block space-y-1.5 text-sm">
                      <span className={fieldLabel}>Provider</span>
                      <select
                        className={fieldControl}
                        value={selectedProviderId}
                        onChange={(e) => {
                          setSelectedProviderId(e.target.value);
                          setSlots(null);
                          setSelectedSlot(null);
                        }}
                      >
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
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
                            <p className="text-[0.9375rem] leading-relaxed text-stone-700">
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

          <div className="mt-6 flex flex-col gap-3 border-t border-stone-100 pt-6 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-8">
            <button
              type="button"
              className="focus-ring touch-manipulation inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#0f5f5c] px-6 py-3.5 text-base font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-[#0f817b] active:bg-[#0c4d4a] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:w-auto sm:min-w-[200px] sm:py-3.5 sm:text-sm"
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
              <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-[0.9375rem] text-stone-700 sm:text-sm">
                {slotsHint}
              </p>
            ) : null}
            {slotsError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.9375rem] text-red-900 sm:text-sm">
                {slotsError}
              </p>
            ) : null}

            {slots && slots.length > 0 ? (
              <div className="space-y-3">
                <p className={fieldLabel}>Available start times</p>
                <div className="grid grid-cols-2 gap-2 min-[400px]:gap-3 min-[480px]:grid-cols-3 lg:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s.startIso}
                      className={`focus-ring touch-manipulation flex min-h-[54px] w-full items-center justify-center rounded-xl border px-2 py-2.5 text-center text-[0.8125rem] font-semibold leading-tight transition min-[400px]:px-3 min-[400px]:text-sm sm:min-h-[52px] sm:justify-start sm:text-left sm:text-sm ${
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
          </>
          ) : null}
        </section>

        <section
          aria-labelledby="step-three"
          className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm sm:p-8"
        >
          <div className="border-b border-stone-100 pb-4 sm:pb-6">
            <h2 id="step-three" className="text-lg font-black leading-tight text-[#173f3b] sm:text-2xl">
              Your contact details
            </h2>
            <p className="mt-1.5 text-[0.9375rem] leading-snug text-stone-600 sm:text-sm">
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

          <div className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-5">
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
                className={`${fieldControl} min-h-[120px] resize-y sm:min-h-[100px]`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything we should know? Reason for visit, allergies, pregnancy, etc."
              />
            </label>
          </div>

          <p className="mt-5 text-[0.8125rem] leading-relaxed text-stone-600 sm:mt-6 sm:text-xs">
            We only collect your contact details and visit preferences. No insurance or medical records
            are stored here. By submitting you agree to be contacted about your appointment.
          </p>

          <button
            type="button"
            className="focus-ring touch-manipulation mt-5 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#f2d25d] px-6 py-3.5 text-base font-black uppercase tracking-wide text-[#173f3b] shadow-sm transition hover:bg-[#e6c13d] active:bg-[#d9b635] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-6 sm:min-h-0 sm:w-auto sm:min-w-[240px] sm:text-sm"
            disabled={!selectedSlot || submitting || !name || !phone || !email || !canPickSlots}
            onClick={submitBooking}
          >
            {submitting ? "Submitting…" : "Submit booking request"}
          </button>

          {submitMessage ? (
            <div
              className={`mt-5 space-y-4 rounded-xl border px-4 py-4 text-[0.9375rem] leading-relaxed sm:mt-6 sm:px-5 sm:py-5 sm:text-sm ${
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
                    className="focus-ring touch-manipulation inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#0f5f5c] px-5 py-3.5 text-center text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-[#0f817b] active:bg-[#0c4d4a] sm:min-h-0 sm:w-auto"
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
          <aside className="mt-6 h-fit rounded-2xl border border-[#0f5f5c]/25 bg-gradient-to-b from-[#eaf6f4] to-[#e2f0ec] p-4 text-sm shadow-sm sm:p-5 lg:sticky lg:top-24 lg:mt-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#0f5f5c]">Your selection</p>
            <p className="mt-2 text-[1.35rem] font-black leading-snug text-[#173f3b] sm:text-xl">{selectedSlot.label}</p>
            <dl className="mt-4 space-y-2.5 border-t border-[#0f5f5c]/10 pt-4 text-[0.9375rem] text-stone-700 sm:text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Duration</dt>
                <dd className="font-semibold text-[#173f3b]">{durationMin} min</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Service</dt>
                <dd className="font-semibold text-[#173f3b]">
                  {visitKind === "stretch" ? "Stretch" : "Massage"}
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
