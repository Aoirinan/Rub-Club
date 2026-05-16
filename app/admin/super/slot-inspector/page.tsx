"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { TIME_ZONE } from "@/lib/constants";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { staffMeetsMin, type StaffRole } from "@/lib/staff-roles";

type Me = { authenticated: boolean; role?: StaffRole | null; email?: string | null };

type Slot = { startIso: string; label: string };

type ProviderDebug = {
  id: string;
  displayName: string;
  active: boolean;
  schedule: { openHour: number; openMinute: number; closeHour: number; closeMinute: number } | null;
};

type BookingDebug = {
  id: string;
  startIso: string;
  startAtMs: number;
  locationId: string;
  serviceLine: string;
  durationMin: number;
  providerId: string;
  providerDisplayName: string;
  status: string;
  bucketIds: string[];
};

type BucketDebug = {
  id: string;
  bookingId: string | null;
  holdId: string | null;
  providerId: string | null;
  scope: string | null;
  serviceLine: string | null;
  durationMin: number | null;
  startIso: string | null;
  kind: "booking" | "hold";
};

type HoldDebug = {
  id: string;
  locationId: string;
  scope: string;
  startIso: string;
  startAtMs: number;
  endIso: string;
  endAtMs: number;
  durationMin: number;
  note: string;
  createdByEmail: string | null;
};

type InspectResponse = {
  date: string;
  locationId: string;
  serviceLine: string;
  providers: ProviderDebug[];
  bookings: BookingDebug[];
  buckets: BucketDebug[];
  holds: HoldDebug[];
};

function formatHM(hour: number, minute: number): string {
  const h = ((hour % 24) + 24) % 24;
  const am = h < 12 || h === 24;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

function todayChicago(): string {
  return DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd");
}

export default function SlotInspectorPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [meReady, setMeReady] = useState(false);

  const [date, setDate] = useState(todayChicago());
  const [locationId, setLocationId] = useState<"paris" | "sulphur_springs">("paris");
  const [serviceLine, setServiceLine] = useState<"massage" | "chiropractic">("massage");
  const [durationMin, setDurationMin] = useState<30 | 60>(30);
  const [providerMode, setProviderMode] = useState<"any" | "specific">("any");
  const [providerId, setProviderId] = useState<string>("");

  const [inspect, setInspect] = useState<InspectResponse | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` } });
      const data = (await res.json()) as Me;
      setMe(data);
      setMeReady(true);
    });
    return () => unsub();
  }, [auth, router]);

  const getIdToken = useCallback(async () => {
    return auth?.currentUser ? auth.currentUser.getIdToken() : null;
  }, [auth]);

  const runInspect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) {
        setError("Not signed in.");
        return;
      }

      const inspectQs = new URLSearchParams({ date, locationId, serviceLine });
      const inspectRes = await fetch(`/api/admin/slot-inspect?${inspectQs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!inspectRes.ok) {
        const data = (await inspectRes.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not load inspector.");
        setInspect(null);
        setSlots(null);
        return;
      }
      const inspectData = (await inspectRes.json()) as InspectResponse;
      setInspect(inspectData);

      const slotsQs = new URLSearchParams({
        date,
        locationId,
        serviceLine,
        durationMin: String(durationMin),
        providerMode,
      });
      if (providerMode === "specific" && providerId) slotsQs.set("providerId", providerId);
      const slotsRes = await fetch(`/api/slots?${slotsQs.toString()}`, { cache: "no-store" });
      const slotsData = (await slotsRes.json().catch(() => ({}))) as {
        slots?: Slot[];
        error?: string;
      };
      if (!slotsRes.ok) {
        setError(slotsData.error ?? "Could not load slots.");
        setSlots(null);
        return;
      }
      setSlots(slotsData.slots ?? []);
    } finally {
      setLoading(false);
    }
  }, [date, locationId, serviceLine, durationMin, providerMode, providerId, getIdToken]);

  useEffect(() => {
    if (!meReady || !me?.role || !staffMeetsMin(me.role, "manager")) return;
    runInspect();
    // run once on first ready; users press "Refresh" or change inputs + button after that
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meReady, me?.role]);

  const isOperations = me?.role ? staffMeetsMin(me.role, "manager") : false;

  const slotTimes = useMemo(() => new Set((slots ?? []).map((s) => s.startIso)), [slots]);

  if (!meReady) {
    return <div className="px-4 py-16 text-center text-sm text-slate-600">Checking permissions…</div>;
  }

  if (!isOperations) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">Slot Inspector</h1>
        <p className="mt-2 text-sm text-slate-600">
          This tool is only available to staff managers.
        </p>
        <Link
          href="/admin"
          className="mt-4 inline-block rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
        >
          Back to bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Operations · Diagnostics
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Slot Inspector</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            See exactly what the customer booking page returns for a given date and service —
            alongside the bookings, slot buckets, and holds in Firestore that drive it. Useful for
            answering &ldquo;why is this time still open?&rdquo; or &ldquo;why is this time
            blocked?&rdquo; questions.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/super"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
          >
            Back to operations
          </Link>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          What to inspect
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayChicago())}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Location</span>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value as "paris" | "sulphur_springs")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="paris">Paris, TX</option>
              <option value="sulphur_springs">Sulphur Springs, TX</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Service</span>
            <select
              value={serviceLine}
              onChange={(e) => setServiceLine(e.target.value as "massage" | "chiropractic")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="massage">Massage</option>
              <option value="chiropractic">Chiropractic</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Duration</span>
            <select
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value) as 30 | 60)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Provider mode</span>
            <select
              value={providerMode}
              onChange={(e) => setProviderMode(e.target.value as "any" | "specific")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="any">First available (any)</option>
              <option value="specific">Specific provider</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Provider</span>
            <select
              value={providerId}
              disabled={providerMode !== "specific"}
              onChange={(e) => setProviderId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100"
            >
              <option value="">— pick one —</option>
              {(inspect?.providers ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={runInspect}
            disabled={loading}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Running…" : "Run inspector"}
          </button>
        </div>
        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {error}
          </p>
        ) : null}
      </section>

      {inspect ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={`Customer would see ${slots?.length ?? 0} open slot(s)`} accent="emerald">
            {slots && slots.length > 0 ? (
              <ul className="grid grid-cols-2 gap-1.5 text-sm sm:grid-cols-3">
                {slots.map((s) => (
                  <li
                    key={s.startIso}
                    className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-900 ring-1 ring-emerald-200"
                  >
                    {s.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">
                No open slots returned by <code>/api/slots</code> for this query.
              </p>
            )}
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-slate-600">Raw startIso values</summary>
              <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-2 text-[11px] text-slate-700">
                {JSON.stringify([...slotTimes], null, 2)}
              </pre>
            </details>
          </Card>

          <Card
            title={`${inspect.providers.length} provider(s) eligible for ${inspect.locationId} / ${inspect.serviceLine}`}
            accent="slate"
          >
            {inspect.providers.length === 0 ? (
              <p className="text-sm text-slate-600">
                No active providers — every slot will be empty regardless of bookings.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {inspect.providers.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-900">{p.displayName}</span>
                      <span className="ml-2 font-mono text-[11px] text-slate-500">{p.id}</span>
                    </div>
                    <span className="text-xs text-slate-600">
                      {p.schedule
                        ? `${formatHM(p.schedule.openHour, p.schedule.openMinute)} – ${formatHM(p.schedule.closeHour, p.schedule.closeMinute)}`
                        : "default 9 AM – 5 PM"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`${inspect.bookings.length} booking(s) on this day`} accent="indigo">
            {inspect.bookings.length === 0 ? (
              <p className="text-sm text-slate-600">No bookings for this date/location/service.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {inspect.bookings.map((b) => {
                  const dt = DateTime.fromMillis(b.startAtMs).setZone(TIME_ZONE);
                  return (
                    <li key={b.id} className="rounded-md bg-slate-50 p-2 text-xs">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          {dt.isValid ? dt.toFormat("h:mm a") : b.startIso} · {b.durationMin}m
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses(b.status)}`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-700">
                        {b.providerDisplayName || "(unassigned)"}
                        <span className="ml-2 font-mono text-[10px] text-slate-500">
                          {b.providerId || "—"}
                        </span>
                      </div>
                      {b.bucketIds.length > 0 ? (
                        <div className="mt-1 font-mono text-[10px] text-slate-500">
                          buckets: {b.bucketIds.join(", ")}
                        </div>
                      ) : (
                        <div className="mt-1 text-[10px] text-amber-700">
                          ⚠ no bucketIds — booking was created with skipConflictCheck
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title={`${inspect.holds.length} hold(s) on this day`} accent="rose">
            {inspect.holds.length === 0 ? (
              <p className="text-sm text-slate-600">No admin holds for this location.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {inspect.holds.map((h) => {
                  const start = DateTime.fromMillis(h.startAtMs).setZone(TIME_ZONE);
                  const end = DateTime.fromMillis(h.endAtMs).setZone(TIME_ZONE);
                  return (
                    <li key={h.id} className="rounded-md bg-rose-50 p-2 text-xs ring-1 ring-rose-200">
                      <div className="font-semibold text-rose-900">
                        {start.isValid ? start.toFormat("h:mm a") : h.startIso}
                        {" – "}
                        {end.isValid ? end.toFormat("h:mm a") : h.endIso}
                      </div>
                      <div className="mt-0.5 text-slate-700">
                        scope: {h.scope} · {h.durationMin} min
                      </div>
                      {h.note ? <div className="mt-0.5 italic text-slate-600">&ldquo;{h.note}&rdquo;</div> : null}
                      {h.createdByEmail ? (
                        <div className="mt-0.5 text-[10px] text-slate-500">by {h.createdByEmail}</div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card
            title={`${inspect.buckets.length} slot_bucket(s) on this day`}
            accent="slate"
            className="lg:col-span-2"
          >
            {inspect.buckets.length === 0 ? (
              <p className="text-sm text-slate-600">
                No buckets exist for this date/location. Every customer slot will return open if
                providers are scheduled.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-2 py-1">Bucket id</th>
                      <th className="px-2 py-1">Kind</th>
                      <th className="px-2 py-1">References</th>
                      <th className="px-2 py-1">Service / duration</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {inspect.buckets.map((b) => (
                      <tr key={b.id} className="border-t border-slate-100">
                        <td className="px-2 py-1 text-slate-800">{b.id}</td>
                        <td className="px-2 py-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-sans font-semibold ${
                              b.kind === "hold"
                                ? "bg-rose-100 text-rose-900"
                                : "bg-emerald-100 text-emerald-900"
                            }`}
                          >
                            {b.kind}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-slate-700">
                          {b.kind === "hold"
                            ? `holdId=${b.holdId ?? "—"} · scope=${b.scope ?? "—"}`
                            : `bookingId=${b.bookingId ?? "—"} · providerId=${b.providerId ?? "—"}`}
                        </td>
                        <td className="px-2 py-1 text-slate-700">
                          {b.serviceLine ?? "—"}
                          {typeof b.durationMin === "number" ? ` · ${b.durationMin}m` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Card({
  title,
  accent,
  children,
  className,
}: {
  title: string;
  accent: "emerald" | "slate" | "indigo" | "rose";
  children: React.ReactNode;
  className?: string;
}) {
  const accentClasses: Record<typeof accent, string> = {
    emerald: "border-emerald-200",
    slate: "border-slate-200",
    indigo: "border-indigo-200",
    rose: "border-rose-200",
  };
  return (
    <section
      className={`rounded-2xl border ${accentClasses[accent]} bg-white p-4 shadow-sm space-y-2 ${className ?? ""}`}
    >
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function statusClasses(status: string): string {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-900";
  if (status === "pending") return "bg-amber-100 text-amber-900";
  if (status === "cancelled") return "bg-slate-200 text-slate-700";
  if (status === "declined") return "bg-rose-100 text-rose-900";
  return "bg-slate-100 text-slate-700";
}
