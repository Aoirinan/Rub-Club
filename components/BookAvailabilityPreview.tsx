"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import {
  TIME_ZONE,
  telHref,
  type DurationMin,
  type LocationId,
  type LocationInfo,
  type ServiceLine,
} from "@/lib/constants";

type Slot = { startIso: string; label: string };

const fieldLabel = "block text-xs font-bold uppercase tracking-wide text-stone-600";
const fieldControl =
  "w-full min-h-[48px] rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-[#4a1515] shadow-sm";

function todayIso(): string {
  return DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd");
}

function addDaysIso(days: number): string {
  return DateTime.now().setZone(TIME_ZONE).plus({ days }).toFormat("yyyy-LL-dd");
}

export function BookAvailabilityPreview({
  locations,
}: {
  locations: Record<LocationId, LocationInfo>;
}) {
  const [locationId, setLocationId] = useState<LocationId>("paris");
  const [serviceLine, setServiceLine] = useState<ServiceLine>("massage");
  const [durationMin, setDurationMin] = useState<DurationMin>(60);
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const loc = locations[locationId];
  const minDate = todayIso();
  const maxDate = addDaysIso(60);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setSlotsError(null);
    setSlots(null);
    setSelectedSlot(null);
    try {
      const qs = new URLSearchParams({
        locationId,
        date,
        durationMin: String(durationMin),
        serviceLine,
        providerMode: "any",
        preview: "1",
      });
      const res = await fetch(`/api/slots?${qs.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as { slots?: Slot[]; error?: string };
      if (!res.ok) {
        setSlotsError(data.error ?? "Could not load open times.");
        setSlots([]);
        return;
      }
      setSlots(data.slots ?? []);
    } catch {
      setSlotsError("Could not load open times. Please call the office.");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [locationId, date, durationMin, serviceLine]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const phone = useMemo(() => {
    if (locationId === "sulphur_springs") return loc.phonePrimary;
    return serviceLine === "massage" && loc.phoneSecondary
      ? loc.phoneSecondary
      : loc.phonePrimary;
  }, [locationId, serviceLine, loc]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#c0392b]/25 bg-[#f0faf8] p-5 sm:p-6">
        <p className="text-lg font-black text-[#4a1515]">
          Select a time and call us to confirm your appointment
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          Openings below are for reference. Online booking with payment is coming soon — for now,
          choose a time and call so we can hold it for you.
        </p>
        <a
          href={telHref(phone)}
          className="mt-4 inline-flex min-h-[48px] items-center rounded-xl bg-[#c0392b] px-6 py-3 text-lg font-black text-white hover:bg-[#0c4a48]"
        >
          Call {phone}
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm">
          <span className={fieldLabel}>Location</span>
          <select
            className={fieldControl}
            value={locationId}
            onChange={(e) => setLocationId(e.target.value as LocationId)}
          >
            <option value="paris">{locations.paris.shortName}</option>
            <option value="sulphur_springs">{locations.sulphur_springs.shortName}</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className={fieldLabel}>Service</span>
          <select
            className={fieldControl}
            value={serviceLine}
            onChange={(e) => setServiceLine(e.target.value as ServiceLine)}
          >
            <option value="massage">Massage</option>
            <option value="chiropractic">Chiropractic</option>
            <option value="stretch">Stretch</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className={fieldLabel}>Duration</span>
          <select
            className={fieldControl}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value) as DurationMin)}
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
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      <div>
        <p className={fieldLabel}>Available times</p>
        {loadingSlots ? (
          <p className="mt-3 text-sm text-stone-600">Loading openings…</p>
        ) : slotsError ? (
          <p className="mt-3 text-sm text-amber-900">{slotsError}</p>
        ) : slots && slots.length === 0 ? (
          <p className="mt-3 text-sm text-stone-700">
            No openings on this day — try another date or call{" "}
            <a className="font-bold text-[#c0392b] underline" href={telHref(phone)}>
              {phone}
            </a>
            .
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {(slots ?? []).map((slot) => (
              <li key={slot.startIso}>
                <button
                  type="button"
                  className={`focus-ring min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-bold ${
                    selectedSlot?.startIso === slot.startIso
                      ? "border-[#c0392b] bg-[#c0392b] text-white"
                      : "border-stone-300 bg-white text-[#4a1515] hover:border-[#c0392b]"
                  }`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedSlot ? (
          <p className="mt-4 text-sm font-semibold text-[#4a1515]">
            Selected: {selectedSlot.label} — call{" "}
            <a className="font-black text-[#c0392b] underline" href={telHref(phone)}>
              {phone}
            </a>{" "}
            to confirm.
          </p>
        ) : null}
      </div>

      <p className="text-center text-sm">
        <Link href="/contact" className="font-bold text-[#c0392b] underline">
          Contact form
        </Link>
      </p>
    </div>
  );
}
