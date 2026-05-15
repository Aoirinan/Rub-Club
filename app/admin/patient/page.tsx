"use client";

import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { TIME_ZONE } from "@/lib/constants";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import type { PatientIntakeRow } from "@/lib/patient-record-lookup";

type BookingDoc = Record<string, unknown> & { id?: string };

function schedLink(b: BookingDoc): string | null {
  const startIso = typeof b.startIso === "string" ? b.startIso : null;
  if (!startIso) return null;
  const dt = DateTime.fromISO(startIso, { zone: "utc" }).setZone(TIME_ZONE);
  if (!dt.isValid) return null;
  const date = dt.toFormat("yyyy-LL-dd");
  const id = typeof b.id === "string" ? b.id : "";
  if (!id) return null;
  return `/admin?date=${encodeURIComponent(date)}&focus=${encodeURIComponent(id)}`;
}

export default function AdminPatientPage() {
  return (
    <Suspense
      fallback={<div className="px-4 py-16 text-center text-sm text-slate-600">Loading…</div>}
    >
      <AdminPatientContent />
    </Suspense>
  );
}

function AdminPatientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") ?? "";
  const initialDigits = initialPhone.replace(/\D/g, "");

  const [auth, setAuth] = useState<Auth | null>(null);
  const [phoneDraft, setPhoneDraft] = useState(initialPhone);
  const [phoneQuery, setPhoneQuery] = useState(initialDigits.length >= 7 ? initialPhone : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [intakes, setIntakes] = useState<PatientIntakeRow[]>([]);
  const [smsLog, setSmsLog] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    const user = auth?.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace("/admin/login");
    });
    return () => unsub();
  }, [auth, router]);

  const load = useCallback(async () => {
    const digits = phoneQuery.replace(/\D/g, "");
    if (digits.length < 7) {
      setBookings([]);
      setIntakes([]);
      setSmsLog([]);
      setError(null);
      return;
    }
    const token = await getIdToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/patient?phone=${encodeURIComponent(phoneQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        error?: string;
        bookings?: BookingDoc[];
        intakes?: PatientIntakeRow[];
        smsLog?: Record<string, unknown>[];
      };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not load patient.");
        return;
      }
      setBookings(data.bookings ?? []);
      setIntakes(data.intakes ?? []);
      setSmsLog(data.smsLog ?? []);
    } finally {
      setLoading(false);
    }
  }, [getIdToken, phoneQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const p = searchParams.get("phone") ?? "";
    setPhoneDraft(p);
    const d = p.replace(/\D/g, "");
    setPhoneQuery(d.length >= 7 ? p : "");
  }, [searchParams]);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const q = phoneDraft.trim();
    router.replace(q ? `/admin/patient?phone=${encodeURIComponent(q)}` : "/admin/patient");
    const d = q.replace(/\D/g, "");
    setPhoneQuery(d.length >= 7 ? q : "");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Patient record</h1>
            <p className="text-xs text-slate-500">Bookings, intake, and SMS history by phone.</p>
          </div>
          <Link
            href="/admin"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
          >
            Scheduler
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <form onSubmit={submitSearch} className="flex flex-wrap items-end gap-2">
          <label className="min-w-[200px] flex-1 text-sm font-semibold text-slate-700">
            Phone
            <input
              type="tel"
              value={phoneDraft}
              onChange={(e) => setPhoneDraft(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="903-555-0100"
              autoComplete="tel"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Look up
          </button>
        </form>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>
        ) : null}

        {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}

        {!loading && phoneQuery.replace(/\D/g, "").length >= 7 ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">Appointments ({bookings.length})</h2>
              </header>
              <ul className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <li className="px-4 py-6 text-sm text-slate-600">No bookings for this phone.</li>
                ) : (
                  bookings.map((b) => {
                    const name = typeof b.name === "string" ? b.name : "—";
                    const status = typeof b.status === "string" ? b.status : "—";
                    const svc = typeof b.serviceLine === "string" ? b.serviceLine : "—";
                    const when =
                      typeof b.startIso === "string"
                        ? DateTime.fromISO(b.startIso, { zone: "utc" })
                            .setZone(TIME_ZONE)
                            .toFormat("ccc LLL d yyyy · h:mm a")
                        : "—";
                    const href = schedLink(b);
                    return (
                      <li key={String(b.id)} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{when}</p>
                          <p className="text-sm text-slate-700">
                            {name} · <span className="capitalize">{svc}</span> · {status}
                          </p>
                        </div>
                        {href ? (
                          <Link href={href} className="text-xs font-semibold text-sky-800 underline">
                            Open in scheduler
                          </Link>
                        ) : null}
                      </li>
                    );
                  })
                )}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">Intake / insurance ({intakes.length})</h2>
              </header>
              {intakes.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-600">No intake forms for this phone.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {intakes.map((row) => (
                    <li key={row.id} className="space-y-3 px-4 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {[row.firstName, row.lastName].filter(Boolean).join(" ") || "Intake"}
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {row.insuranceFrontUrl ? (
                          <a
                            href={row.insuranceFrontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-sky-800 underline"
                          >
                            Insurance card front
                          </a>
                        ) : null}
                        {row.insuranceBackUrl ? (
                          <a
                            href={row.insuranceBackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-sky-800 underline"
                          >
                            Insurance card back
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">SMS log ({smsLog.length})</h2>
              </header>
              {smsLog.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-600">No SMS records (or index still building).</p>
              ) : (
                <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                  {smsLog.map((row) => {
                    const msg = typeof row.message === "string" ? row.message : "";
                    const id = typeof row.id === "string" ? row.id : "";
                    return (
                      <li key={id} className="px-4 py-2 text-xs text-slate-700">
                        <p className="whitespace-pre-line">{msg}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        ) : !loading ? (
          <p className="text-sm text-slate-600">Enter at least 7 digits and choose Look up.</p>
        ) : null}
      </main>
    </div>
  );
}
