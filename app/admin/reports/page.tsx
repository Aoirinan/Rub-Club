"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

type Summary = {
  totalBookings: number;
  statusCounts: Record<string, number>;
  serviceCounts: Record<string, number>;
  locationCounts: Record<string, number>;
  totalConfirmedMinutes: number;
  confirmationRate: number;
  cancellationRate: number;
  paidTotal: number;
  paidCount: number;
};

type DayStat = {
  date: string;
  total: number;
  confirmed: number;
  cancelled: number;
  declined: number;
  pending: number;
  massage: number;
  chiropractic: number;
};

type ProviderStat = {
  id: string;
  displayName: string;
  total: number;
  confirmed: number;
  cancelled: number;
};

type ReportData = {
  period: { from: string; to: string; days: number };
  summary: Summary;
  daily: DayStat[];
  providers: ProviderStat[];
};

export default function ReportsPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [locationId, setLocationId] = useState("");

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    const user = auth?.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }, [auth]);

  const loadReport = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ days: String(days) });
      if (locationId) qs.set("locationId", locationId);
      const res = await fetch(`/api/admin/reports?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Failed to load reports.");
        return;
      }
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [getIdToken, days, locationId]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      setAuthed(true);
    });
    return () => unsub();
  }, [auth, router]);

  useEffect(() => {
    if (authed) loadReport();
  }, [authed, loadReport]);

  const downloadCsv = useCallback(async () => {
    const token = await getIdToken();
    if (!token || !data) return;
    const qs = new URLSearchParams({
      from: `${data.period.from}T00:00:00.000Z`,
      to: `${data.period.to}T23:59:59.999Z`,
    });
    if (locationId) qs.set("locationId", locationId);
    const res = await fetch(`/api/admin/bookings/export?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${data.period.from}-to-${data.period.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getIdToken, data, locationId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Reports & Analytics</h1>
            <p className="text-xs text-slate-500">Scheduling performance at a glance.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void downloadCsv()}
              disabled={!data || loading}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400 disabled:opacity-50"
            >
              Download CSV
            </button>
            <Link
              href="/admin"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
            >
              Back to scheduler
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-slate-700">Period</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-slate-700">Location</span>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              <option value="">All locations</option>
              <option value="paris">Paris</option>
              <option value="sulphur_springs">Sulphur Springs</option>
            </select>
          </label>
          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>
        ) : null}

        {data ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total bookings" value={String(data.summary.totalBookings)} />
              <StatCard
                label="Confirmation rate"
                value={`${data.summary.confirmationRate}%`}
                sub={`${data.summary.statusCounts.confirmed ?? 0} confirmed`}
              />
              <StatCard
                label="Cancellation rate"
                value={`${data.summary.cancellationRate}%`}
                sub={`${data.summary.statusCounts.cancelled ?? 0} cancelled`}
              />
              <StatCard
                label="Confirmed hours"
                value={`${(data.summary.totalConfirmedMinutes / 60).toFixed(1)}h`}
                sub={`${data.summary.totalConfirmedMinutes} minutes`}
              />
            </section>

            {data.summary.paidCount > 0 ? (
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Revenue collected"
                  value={`$${(data.summary.paidTotal / 100).toFixed(2)}`}
                  sub={`${data.summary.paidCount} payments`}
                />
              </section>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">By service</h3>
                <div className="mt-3 space-y-2">
                  {Object.entries(data.summary.serviceCounts).map(([svc, count]) => (
                    <div key={svc} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded-full ${svc === "massage" ? "bg-teal-500" : svc === "chiropractic" ? "bg-indigo-500" : "bg-slate-400"}`}
                        />
                        <span className="text-sm capitalize text-slate-700">{svc}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">By status</h3>
                <div className="mt-3 space-y-2">
                  {Object.entries(data.summary.statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded-full ${
                            status === "confirmed"
                              ? "bg-emerald-500"
                              : status === "pending"
                                ? "bg-amber-500"
                                : status === "cancelled"
                                  ? "bg-rose-500"
                                  : "bg-slate-400"
                          }`}
                        />
                        <span className="text-sm capitalize text-slate-700">{status}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {data.providers.length > 0 ? (
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="border-b border-slate-200 px-5 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">Provider breakdown</h3>
                </header>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-3">Provider</th>
                        <th className="px-5 py-3 text-right">Total</th>
                        <th className="px-5 py-3 text-right">Confirmed</th>
                        <th className="px-5 py-3 text-right">Cancelled</th>
                        <th className="px-5 py-3 text-right">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.providers.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-medium text-slate-900">{p.displayName}</td>
                          <td className="px-5 py-3 text-right text-slate-700">{p.total}</td>
                          <td className="px-5 py-3 text-right text-emerald-700">{p.confirmed}</td>
                          <td className="px-5 py-3 text-right text-rose-700">{p.cancelled}</td>
                          <td className="px-5 py-3 text-right font-semibold text-slate-900">
                            {p.total > 0 ? `${Math.round((p.confirmed / p.total) * 100)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {data.daily.length > 0 ? (
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="border-b border-slate-200 px-5 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">Daily volume</h3>
                </header>
                <div className="px-5 py-4">
                  <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
                    {data.daily.map((d) => {
                      const maxVal = Math.max(...data.daily.map((x) => x.total), 1);
                      const h = Math.max(4, (d.total / maxVal) * 100);
                      return (
                        <div
                          key={d.date}
                          className="group relative flex-1"
                          title={`${d.date}: ${d.total} bookings`}
                        >
                          <div
                            className="w-full rounded-t bg-slate-700 transition hover:bg-slate-900"
                            style={{ height: `${h}%` }}
                          />
                          <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] text-white shadow group-hover:block">
                            {d.date}: {d.total}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                    <span>{data.daily[0]?.date}</span>
                    <span>{data.daily[data.daily.length - 1]?.date}</span>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        ) : loading ? (
          <p className="text-center text-sm text-slate-500">Loading reports…</p>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}
