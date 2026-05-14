"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { LOCATIONS, TIME_ZONE } from "@/lib/constants";

type Slot = { startIso: string; label: string };

type BookingInfo = {
  status: string;
  locationId: string;
  serviceLine: string;
  durationMin: number;
  startIso: string;
  providerId: string;
  providerDisplayName: string;
  name: string;
  canReschedule: boolean;
};

function addDaysIso(days: number): string {
  return DateTime.now().setZone(TIME_ZONE).plus({ days }).toFormat("yyyy-LL-dd");
}

export default function ManageBookingClient({ initialToken }: { initialToken: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [working, setWorking] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const [pickDate, setPickDate] = useState<string>("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const loadInfo = useCallback(async () => {
    if (!initialToken.trim()) {
      setLoading(false);
      setError("This page needs the link from your confirmation email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/patient/booking/info", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: initialToken.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string } & Partial<BookingInfo>;
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not load appointment.");
        setInfo(null);
        return;
      }
      const row: BookingInfo = {
        status: String(data.status ?? ""),
        locationId: String(data.locationId ?? ""),
        serviceLine: String(data.serviceLine ?? ""),
        durationMin: Number(data.durationMin ?? 0),
        startIso: String(data.startIso ?? ""),
        providerId: String(data.providerId ?? ""),
        providerDisplayName: String(data.providerDisplayName ?? ""),
        name: String(data.name ?? ""),
        canReschedule: Boolean(data.canReschedule),
      };
      setInfo(row);
      const d = DateTime.fromISO(row.startIso, { zone: "utc" }).setZone(TIME_ZONE);
      setPickDate(d.isValid ? d.toFormat("yyyy-LL-dd") : addDaysIso(0));
    } finally {
      setLoading(false);
    }
  }, [initialToken]);

  useEffect(() => {
    void loadInfo();
  }, [loadInfo]);

  const loadSlots = useCallback(async () => {
    if (!info?.canReschedule || !pickDate) return;
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots(null);
    setSelectedSlot(null);
    try {
      const qs = new URLSearchParams({
        locationId: info.locationId,
        serviceLine: info.serviceLine,
        durationMin: String(info.durationMin),
        date: pickDate,
        providerMode: "specific",
        providerId: info.providerId,
      });
      const res = await fetch(`/api/slots?${qs.toString()}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { slots?: Slot[]; error?: string };
      if (!res.ok) {
        setSlotsError(typeof data.error === "string" ? data.error : "Could not load times.");
        return;
      }
      setSlots(data.slots ?? []);
    } finally {
      setSlotsLoading(false);
    }
  }, [info, pickDate]);

  useEffect(() => {
    if (info?.canReschedule && pickDate) void loadSlots();
  }, [info, pickDate, loadSlots]);

  const dateOptions = useMemo(() => {
    const out: string[] = [];
    const start = DateTime.now().setZone(TIME_ZONE).startOf("day");
    for (let i = 0; i < 90; i++) {
      out.push(start.plus({ days: i }).toFormat("yyyy-LL-dd"));
    }
    return out;
  }, []);

  async function cancelAppointment() {
    if (!initialToken.trim()) return;
    setWorking(true);
    setDoneMessage(null);
    try {
      const res = await fetch("/api/patient/booking/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: initialToken.trim(),
          ...(cancelReason.trim() ? { reason: cancelReason.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDoneMessage(typeof data.error === "string" ? data.error : "Could not cancel.");
        return;
      }
      setDoneMessage("Your appointment has been cancelled. You can close this page.");
      setInfo(null);
    } finally {
      setWorking(false);
    }
  }

  async function rescheduleAppointment() {
    if (!initialToken.trim() || !selectedSlot) return;
    setWorking(true);
    setDoneMessage(null);
    try {
      const res = await fetch("/api/patient/booking/reschedule", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: initialToken.trim(), startIso: selectedSlot.startIso }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDoneMessage(typeof data.error === "string" ? data.error : "Could not reschedule.");
        if (res.status === 409) void loadSlots();
        return;
      }
      setDoneMessage("Your appointment time has been updated.");
      await loadInfo();
      setSelectedSlot(null);
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-stone-600">
        <p>Loading your appointment…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2ea] px-4 py-12">
      <div className="mx-auto max-w-lg">
        <header className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0f5f5c]">Manage appointment</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#173f3b]">Cancel or reschedule</h1>
          <p className="mt-2 text-sm text-stone-700">
            Use the secure link from your confirmation email. For help, call the office.
          </p>
        </header>

        <div className="mt-6 space-y-4">
          {error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {error}
            </div>
          ) : null}

          {doneMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              {doneMessage}
            </div>
          ) : null}

          {info ? (
            <section className="space-y-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#0f5f5c]">Current appointment</h2>
              <dl className="space-y-1 text-sm text-stone-800">
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">Patient</dt>
                  <dd className="font-medium">{info.name || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">When</dt>
                  <dd className="text-right font-medium">
                    {DateTime.fromISO(info.startIso, { zone: "utc" })
                      .setZone(TIME_ZONE)
                      .toFormat("ccc, LLL d · h:mm a")}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">Service</dt>
                  <dd className="capitalize">{info.serviceLine}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">Duration</dt>
                  <dd>{info.durationMin} min</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">Provider</dt>
                  <dd className="text-right">{info.providerDisplayName || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-500">Location</dt>
                  <dd className="text-right">
                    {info.locationId === "paris"
                      ? LOCATIONS.paris.shortName
                      : info.locationId === "sulphur_springs"
                        ? LOCATIONS.sulphur_springs.shortName
                        : info.locationId}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-stone-100 pt-4">
                <label className="block space-y-1 text-sm">
                  <span className="text-xs font-semibold text-stone-600">Optional note (sent to the office)</span>
                  <textarea
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. schedule conflict"
                  />
                </label>
                <button
                  type="button"
                  disabled={working}
                  onClick={() => void cancelAppointment()}
                  className="mt-3 w-full rounded-full bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {working ? "Working…" : "Cancel appointment"}
                </button>
              </div>

              {info.canReschedule ? (
                <div className="border-t border-stone-100 pt-4">
                  <h3 className="text-sm font-bold text-[#173f3b]">Reschedule</h3>
                  <p className="mt-1 text-xs text-stone-600">
                    Pick a new date, then a time. Your provider stays the same.
                  </p>
                  <label className="mt-3 block text-sm">
                    <span className="text-xs font-semibold text-stone-600">Date</span>
                    <select
                      className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                      value={pickDate}
                      onChange={(e) => setPickDate(e.target.value)}
                    >
                      {dateOptions.map((d) => (
                        <option key={d} value={d}>
                          {DateTime.fromISO(d, { zone: TIME_ZONE }).toFormat("ccc, LLL d, yyyy")}
                        </option>
                      ))}
                    </select>
                  </label>
                  {slotsLoading ? <p className="mt-2 text-xs text-stone-500">Loading times…</p> : null}
                  {slotsError ? <p className="mt-2 text-xs text-rose-700">{slotsError}</p> : null}
                  {slots && slots.length === 0 && !slotsLoading ? (
                    <p className="mt-2 text-xs text-stone-600">No openings that day. Try another date.</p>
                  ) : null}
                  {slots && slots.length > 0 ? (
                    <div className="mt-2 grid max-h-48 gap-1 overflow-y-auto rounded-md border border-stone-200 p-2">
                      {slots.map((s) => (
                        <button
                          key={s.startIso}
                          type="button"
                          onClick={() => setSelectedSlot(s)}
                          className={`rounded-md px-2 py-1.5 text-left text-sm ${
                            selectedSlot?.startIso === s.startIso
                              ? "bg-[#0f5f5c] font-semibold text-white"
                              : "bg-stone-50 text-stone-800 hover:bg-stone-100"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={working || !selectedSlot}
                    onClick={() => void rescheduleAppointment()}
                    className="mt-3 w-full rounded-full bg-[#0f5f5c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0c4d4b] disabled:opacity-50"
                  >
                    {working ? "Working…" : "Confirm new time"}
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          <p className="text-center text-sm">
            <Link href="/book" className="font-semibold text-[#0f5f5c] underline">
              Book a new appointment
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
