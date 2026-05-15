"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import { onAuthStateChanged, signOut, type Auth } from "firebase/auth";
import { TIME_ZONE } from "@/lib/constants";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import {
  ALL_STATUSES,
  DEFAULT_STATUSES,
  type BookingRow,
  type FilterState,
  type ProviderRow,
  type SchedulerView,
} from "./_scheduler/types";
import {
  bookingsApiQuery,
  chicagoDayStart,
  chicagoStartOfWeek,
  filterByService,
  pickColumnProviders,
  readFilters,
  todayChicagoIsoDate,
  writeFilters,
} from "./_scheduler/helpers";
import {
  bookingStatusLabel,
  bookingStatusPillClasses,
  SERVICE_LINE_COLORS,
  type BookingStatus,
} from "@/lib/booking-status";
import { BookingDrawer } from "./_scheduler/BookingDrawer";
import { NewBookingDrawer } from "./_scheduler/NewBookingDrawer";
import { BlockTimeDrawer } from "./_scheduler/BlockTimeDrawer";
import { HoldsTray, type HoldRow } from "./_scheduler/HoldsTray";
import { DayView, ListView, WeekView } from "./_scheduler/views";

type Me = {
  authenticated: boolean;
  uid?: string;
  email?: string | null;
  role?: "admin" | "superadmin" | null;
};

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-sm text-slate-600">Loading…</div>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [holds, setHolds] = useState<HoldRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [blockTimeOpen, setBlockTimeOpen] = useState(false);
  const [csvImportSkipConflict, setCsvImportSkipConflict] = useState(false);
  const [csvImportBusy, setCsvImportBusy] = useState(false);
  const csvImportInputRef = useRef<HTMLInputElement>(null);
  const seenBookingIdsRef = useRef<Set<string> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderPreview, setReminderPreview] = useState<{
    count: number;
    rows: { bookingId: string; name: string; phone: string; when: string }[];
  } | null>(null);
  const [reminderBusy, setReminderBusy] = useState<"preview" | "send" | null>(null);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  const filters = useMemo<FilterState>(() => readFilters(new URLSearchParams(searchParams.toString())), [searchParams]);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    const user = auth?.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }, [auth]);

  const updateFilters = useCallback(
    (patch: Partial<FilterState>) => {
      const next: FilterState = { ...filters, ...patch };
      const qs = writeFilters(next);
      router.replace(qs ? `/admin?${qs}` : "/admin");
    },
    [filters, router],
  );

  const bookingsQueryKey = useMemo(
    () =>
      [
        filters.view,
        filters.date,
        filters.locationId,
        filters.providerId,
        filters.statuses.join(","),
        filters.q.trim(),
      ].join("|"),
    [
      filters.view,
      filters.date,
      filters.locationId,
      filters.providerId,
      filters.statuses,
      filters.q,
    ],
  );

  useEffect(() => {
    seenBookingIdsRef.current = null;
  }, [bookingsQueryKey]);

  const refreshBookings = useCallback(
    async (opts?: { silent?: boolean }) => {
      const token = await getIdToken();
      if (!token) return;
      if (!opts?.silent) setLoading(true);
      try {
        const { qs } = bookingsApiQuery(filters);
        const res = await fetch(`/api/admin/bookings?${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!opts?.silent) setError("Could not load bookings.");
          return;
        }
        const payload = (await res.json()) as { bookings: BookingRow[] };
        const next = payload.bookings;
        if (opts?.silent && seenBookingIdsRef.current !== null) {
          const prev = seenBookingIdsRef.current;
          const added = next.some((b) => !prev.has(b.id));
          if (added) setToastMessage("New booking added");
        }
        seenBookingIdsRef.current = new Set(next.map((b) => b.id));
        setBookings(next);
        setError(null);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [filters, getIdToken],
  );

  const refreshProviders = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/admin/providers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const payload = (await res.json()) as { providers: ProviderRow[] };
    setProviders(payload.providers);
  }, [getIdToken]);

  const refreshHolds = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const qs = new URLSearchParams({ date: filters.date });
    if (filters.locationId !== "all") qs.set("locationId", filters.locationId);
    const res = await fetch(`/api/admin/holds?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setHolds([]);
      return;
    }
    const payload = (await res.json()) as { holds: HoldRow[] };
    setHolds(payload.holds ?? []);
  }, [getIdToken, filters.date, filters.locationId]);

  const handleRescheduleBooking = useCallback(
    async (bookingId: string, startIso: string) => {
      const token = await getIdToken();
      if (!token) {
        setError("Sign in again to reschedule.");
        return;
      }
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}/reschedule`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ startIso }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not reschedule.");
        return;
      }
      setError(null);
      await refreshBookings();
    },
    [getIdToken, refreshBookings],
  );

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      const token = await user.getIdToken();
      const meRes = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await meRes.json()) as Me;
      setMe(data);
      if (!data.role) {
        setError("Your account is signed in but not yet granted staff access.");
        return;
      }
      await refreshProviders();
      await refreshBookings();
      await refreshHolds();
    });
    return () => unsub();
  }, [auth, router, refreshBookings, refreshProviders, refreshHolds]);

  useEffect(() => {
    if (!me?.role) return;
    refreshBookings();
    refreshHolds();
  }, [filters, me?.role, refreshBookings, refreshHolds]);

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus) {
      setSelectedId(focus);
    }
  }, [searchParams]);

  const viewBookings = useMemo(
    () => filterByService(bookings, filters.serviceLine),
    [bookings, filters.serviceLine],
  );

  const columnProviders = useMemo(
    () => pickColumnProviders(providers, filters),
    [providers, filters],
  );

  const pendingRows = useMemo(
    () =>
      viewBookings
        .filter((b) => b.status === "pending")
        .sort((a, b) => (a.startAtMs ?? 0) - (b.startAtMs ?? 0)),
    [viewBookings],
  );

  const selectedBooking = useMemo(
    () => (selectedId ? viewBookings.find((b) => b.id === selectedId) ?? bookings.find((b) => b.id === selectedId) ?? null : null),
    [selectedId, viewBookings, bookings],
  );

  const handleInvalidCrossProviderDrop = useCallback(() => {
    setToastMessage(
      "You cannot move a visit to another provider’s column. Use Add appointment if the guest needs a different provider.",
    );
  }, []);

  const handleInvalidCrossPatientTimeDrop = useCallback(() => {
    setToastMessage(
      "Please use Add Appointment to create a new booking for this patient.",
    );
  }, []);

  const loadReminderPreview = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    setReminderBusy("preview");
    try {
      const res = await fetch("/api/admin/reminders/preview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        count?: number;
        rows?: { bookingId: string; name: string; phone: string; when: string }[];
        error?: string;
      };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not load reminder preview.");
        setReminderPreview(null);
        return;
      }
      setReminderPreview({
        count: data.count ?? 0,
        rows: Array.isArray(data.rows) ? data.rows : [],
      });
      setError(null);
    } finally {
      setReminderBusy(null);
    }
  }, [getIdToken]);

  const sendReminderBatch = useCallback(async () => {
    const n = reminderPreview?.count ?? 0;
    if (n === 0) return;
    if (
      !window.confirm(
        `Send reminder email/SMS for ${n} patient visit(s)? Each phone/day receives one reminder for the earliest appointment.`,
      )
    ) {
      return;
    }
    const token = await getIdToken();
    if (!token) return;
    setReminderBusy("send");
    try {
      const res = await fetch("/api/admin/reminders/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        sent?: number;
        errors?: string[];
        error?: string;
      };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Send reminders failed.");
        return;
      }
      setReminderOpen(false);
      setReminderPreview(null);
      setError(null);
      const extra = data.errors?.length ? ` Some issues: ${data.errors.slice(0, 3).join("; ")}` : "";
      setToastMessage(`Reminders processed (${data.sent ?? 0} sent).${extra}`);
      await refreshBookings();
    } finally {
      setReminderBusy(null);
    }
  }, [getIdToken, refreshBookings, reminderPreview?.count]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    if (!me?.role) return;
    const id = setInterval(() => {
      void refreshBookings({ silent: true });
    }, 15_000);
    return () => clearInterval(id);
  }, [me?.role, refreshBookings]);

  async function logout() {
    if (!auth) return;
    await signOut(auth);
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Scheduler</h1>
            <p className="text-xs text-slate-500">
              Signed in as {me?.email ?? "…"} {me?.role ? `(${me.role})` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {me?.role ? (
              <button
                type="button"
                onClick={() => setNewBookingOpen(true)}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                + New appointment
              </button>
            ) : null}
            {me?.role ? (
              <button
                type="button"
                onClick={() => setBlockTimeOpen(true)}
                className="rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Block time
              </button>
            ) : null}
            {me?.role ? (
              <button
                type="button"
                onClick={() => {
                  setReminderOpen(true);
                  setReminderPreview(null);
                  void loadReminderPreview();
                }}
                className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100"
              >
                Send reminders
              </button>
            ) : null}
            {me?.role ? (
              <button
                type="button"
                onClick={async () => {
                  const token = await getIdToken();
                  if (!token) return;
                  const { qs } = bookingsApiQuery(filters);
                  const res = await fetch(`/api/admin/bookings/export?${qs}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) return;
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `bookings-export.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
              >
                Export CSV
              </button>
            ) : null}
            {me?.role ? (
              <>
                <input
                  ref={csvImportInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={async (e) => {
                    const input = e.target;
                    const f = input.files?.[0];
                    input.value = "";
                    if (!f) return;
                    const token = await getIdToken();
                    if (!token) {
                      setError("Sign in to import.");
                      return;
                    }
                    setCsvImportBusy(true);
                    setError(null);
                    try {
                      const fd = new FormData();
                      fd.append("file", f);
                      if (csvImportSkipConflict) fd.append("skipConflictCheck", "true");
                      const res = await fetch("/api/admin/bookings/import", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: fd,
                      });
                      const data = (await res.json().catch(() => ({}))) as {
                        error?: string;
                        created?: number;
                        totalRows?: number;
                        errors?: { row: number; message: string }[];
                        skipped?: { row: number; reason: string }[];
                      };
                      if (!res.ok) {
                        setError(typeof data.error === "string" ? data.error : "CSV import failed.");
                        return;
                      }
                      const errLines =
                        data.errors?.slice(0, 12).map((x) => `Row ${x.row}: ${x.message}`) ?? [];
                      const skipN = data.skipped?.length ?? 0;
                      const msg = [
                        `Imported ${data.created ?? 0} of ${data.totalRows ?? 0} row(s).`,
                        skipN ? `Skipped ${skipN} row(s) (e.g. existing booking IDs).` : "",
                        errLines.length ? `Issues:\n${errLines.join("\n")}` : "",
                      ]
                        .filter(Boolean)
                        .join("\n");
                      window.alert(msg);
                      await refreshBookings();
                    } finally {
                      setCsvImportBusy(false);
                    }
                  }}
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-400">
                  <input
                    type="checkbox"
                    checked={csvImportSkipConflict}
                    onChange={(e) => setCsvImportSkipConflict(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Import overlaps
                </label>
                <button
                  type="button"
                  disabled={csvImportBusy}
                  onClick={() => csvImportInputRef.current?.click()}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400 disabled:opacity-50"
                >
                  {csvImportBusy ? "Importing…" : "Import CSV"}
                </button>
              </>
            ) : null}
            {me?.role ? (
              <Link
                href="/admin/reports"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
              >
                Reports
              </Link>
            ) : null}
            {me?.role ? (
              <Link
                href="/admin/patient"
                className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-100"
              >
                Patient lookup
              </Link>
            ) : null}
            {me?.role === "superadmin" ? (
              <Link
                href="/admin/super"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
              >
                Superadmin
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void refreshBookings()}
              disabled={loading}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400 disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p>{error}</p>
            {error.includes("not yet granted staff") ? (
              <p className="mt-2">
                <Link href="/admin/super" className="font-semibold underline">
                  Open staff setup / manager tools
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}

        {me?.role ? (
          <>
            <Toolbar
              filters={filters}
              providers={providers}
              onChange={updateFilters}
            />

            {filters.view === "day" ? (
              <p className="text-xs text-slate-500">
                Day view markers: <span className="font-bold text-emerald-700">✓</span> confirmed online ·{" "}
                <span className="text-slate-500">○</span> not yet online ·{" "}
                <span className="text-sky-600">★</span> checked in ·{" "}
                <span className="font-bold text-amber-700">✕</span> needs reschedule · Same patient, multiple
                visits: <span className="font-semibold">(2×)</span> and ↳ on later times.
              </p>
            ) : null}

            {pendingRows.length > 0 ? (
              <PendingTray rows={pendingRows} onSelect={setSelectedId} />
            ) : null}

            {filters.view === "day" && holds.length > 0 ? (
              <HoldsTray
                holds={holds}
                getIdToken={getIdToken}
                onDeleted={async () => {
                  await refreshHolds();
                }}
              />
            ) : null}

            {filters.view === "day" ? (
              <DayView
                bookings={viewBookings}
                providers={columnProviders}
                filters={filters}
                onSelect={setSelectedId}
                onRescheduleBooking={handleRescheduleBooking}
                onInvalidCrossProviderDrop={handleInvalidCrossProviderDrop}
                onInvalidCrossPatientTimeDrop={handleInvalidCrossPatientTimeDrop}
              />
            ) : null}
            {filters.view === "week" ? (
              <WeekView
                bookings={viewBookings}
                providers={providers}
                filters={filters}
                onSelect={setSelectedId}
              />
            ) : null}
            {filters.view === "list" ? (
              <ListView
                bookings={viewBookings}
                providers={providers}
                filters={filters}
                onSelect={setSelectedId}
              />
            ) : null}
          </>
        ) : null}
      </main>

      <BookingDrawer
        booking={selectedBooking}
        onClose={() => setSelectedId(null)}
        onActionComplete={async () => {
          await refreshBookings();
        }}
        getIdToken={getIdToken}
      />

      <NewBookingDrawer
        open={newBookingOpen}
        onClose={() => setNewBookingOpen(false)}
        onCreated={async () => {
          await refreshBookings();
        }}
        getIdToken={getIdToken}
        providers={providers}
        defaultDate={filters.date}
      />

      <BlockTimeDrawer
        open={blockTimeOpen}
        onClose={() => setBlockTimeOpen(false)}
        onCreated={async () => {
          await refreshHolds();
        }}
        getIdToken={getIdToken}
        defaultDate={filters.date}
      />

      {reminderOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reminder-dialog-title"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <h2 id="reminder-dialog-title" className="text-lg font-semibold text-slate-900">
                  SMS / email reminders
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Patients in the ~24h window (22–26h from now) who have not yet received a reminder.
                  One reminder per phone per day (earliest appointment only).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReminderOpen(false);
                  setReminderPreview(null);
                }}
                className="rounded-full px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto px-4 py-3">
              {reminderBusy === "preview" && !reminderPreview ? (
                <p className="text-sm text-slate-600">Loading preview…</p>
              ) : null}
              {reminderPreview && reminderPreview.count === 0 ? (
                <p className="text-sm text-slate-600">No patients are due for a manual reminder right now.</p>
              ) : null}
              {reminderPreview && reminderPreview.count > 0 ? (
                <ul className="space-y-2 text-sm">
                  {reminderPreview.rows.map((r) => (
                    <li
                      key={r.bookingId}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <span className="font-semibold text-slate-900">{r.name}</span>
                      <span className="block text-xs text-slate-600">{r.phone}</span>
                      <span className="block text-xs text-slate-600">{r.when}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={() => void loadReminderPreview()}
                disabled={reminderBusy !== null}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400 disabled:opacity-50"
              >
                Refresh preview
              </button>
              <button
                type="button"
                onClick={() => void sendReminderBatch()}
                disabled={
                  reminderBusy !== null || !reminderPreview || reminderPreview.count === 0
                }
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {reminderBusy === "send" ? "Sending…" : "Confirm send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 px-4">
          <div className="pointer-events-auto rounded-full border border-slate-800 bg-slate-900 px-5 py-3 text-center text-sm font-medium text-white shadow-lg">
            {toastMessage}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- Toolbar ---------------- */

function Toolbar({
  filters,
  providers,
  onChange,
}: {
  filters: FilterState;
  providers: ProviderRow[];
  onChange: (patch: Partial<FilterState>) => void;
}) {
  const [searchDraft, setSearchDraft] = useState(filters.q);
  const debouncedRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchDraft(filters.q);
  }, [filters.q]);

  function setView(view: SchedulerView) {
    onChange({ view });
  }

  function shiftDate(delta: number) {
    const base = filters.view === "week" ? chicagoStartOfWeek(filters.date) : chicagoDayStart(filters.date);
    const unit = filters.view === "week" ? { days: 7 * delta } : { days: delta };
    const next = base.plus(unit).toFormat("yyyy-LL-dd");
    onChange({ date: next });
  }

  function goToday() {
    onChange({ date: todayChicagoIsoDate() });
  }

  function toggleStatus(s: BookingStatus) {
    const set = new Set(filters.statuses);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    onChange({ statuses: ALL_STATUSES.filter((x) => set.has(x)) });
  }

  function setAllStatuses() {
    onChange({ statuses: ALL_STATUSES });
  }

  function resetStatuses() {
    onChange({ statuses: DEFAULT_STATUSES });
  }

  function handleSearchChange(value: string) {
    setSearchDraft(value);
    if (debouncedRef.current) clearTimeout(debouncedRef.current);
    debouncedRef.current = setTimeout(() => {
      onChange({ q: value });
    }, 250);
  }

  const filteredProviders = providers
    .filter((p) => p.active || filters.providerId === p.id)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName));

  const dateLabel = (() => {
    if (filters.view === "week") {
      const ws = chicagoStartOfWeek(filters.date);
      const we = ws.plus({ days: 6 });
      return `Week of ${ws.toFormat("LLL d")} – ${we.toFormat("LLL d, yyyy")}`;
    }
    const dt = chicagoDayStart(filters.date);
    return dt.toFormat("cccc, LLL d yyyy");
  })();

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-slate-300 bg-white p-0.5 text-sm">
          {(["day", "week", "list"] as SchedulerView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                filters.view === v
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {v === "day" ? "Day" : v === "week" ? "Week" : "List"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.view !== "list" ? (
            <>
              <button
                type="button"
                onClick={() => shiftDate(-1)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm hover:border-slate-400"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goToday}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold hover:border-slate-400"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftDate(1)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm hover:border-slate-400"
                aria-label="Next"
              >
                ›
              </button>
              <span className="ml-2 text-sm font-semibold text-slate-900">{dateLabel}</span>
            </>
          ) : (
            <span className="text-sm font-semibold text-slate-900">All upcoming</span>
          )}
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onChange({ date: e.target.value || todayChicagoIsoDate() })}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <FilterDropdown
          label="Location"
          value={filters.locationId}
          options={[
            { v: "all", l: "All locations" },
            { v: "paris", l: "Paris" },
            { v: "sulphur_springs", l: "Sulphur Springs" },
          ]}
          onChange={(v) => onChange({ locationId: v as FilterState["locationId"] })}
        />
        <FilterDropdown
          label="Service"
          value={filters.serviceLine}
          options={[
            { v: "all", l: "All services" },
            { v: "massage", l: "Massage" },
            { v: "chiropractic", l: "Chiropractic" },
          ]}
          onChange={(v) => onChange({ serviceLine: v as FilterState["serviceLine"] })}
        />
        <FilterDropdown
          label="Provider"
          value={filters.providerId}
          options={[
            { v: "all", l: "All providers" },
            ...filteredProviders.map((p) => ({ v: p.id, l: p.displayName })),
          ]}
          onChange={(v) => onChange({ providerId: v })}
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </span>
          {ALL_STATUSES.map((s) => {
            const on = filters.statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition ${
                  on ? bookingStatusPillClasses(s) : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
              >
                {bookingStatusLabel(s)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={setAllStatuses}
            className="text-xs font-semibold text-slate-700 underline"
          >
            All
          </button>
          <button
            type="button"
            onClick={resetStatuses}
            className="text-xs font-semibold text-slate-700 underline"
          >
            Active
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Service
          </span>
          {SERVICE_LINE_COLORS.map((c) => (
            <span key={c.serviceLine} className="inline-flex items-center gap-1 text-xs text-slate-700">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.dotClass}`} />
              {c.label}
            </span>
          ))}
        </div>

        <div className="ml-auto">
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search name, phone, email…"
            className="w-56 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-normal normal-case tracking-normal text-slate-900"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ---------------- Pending tray ---------------- */

function PendingTray({ rows, onSelect }: { rows: BookingRow[]; onSelect: (id: string) => void }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-semibold text-amber-950">Action needed</h2>
          <p className="text-xs text-amber-900/80">
            {rows.length} pending request{rows.length === 1 ? "" : "s"} — click to accept or decline.
          </p>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
          {rows.length}
        </span>
      </header>
      <ul className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((b) => {
          const start = b.startAtMs
            ? DateTime.fromMillis(b.startAtMs).setZone(TIME_ZONE)
            : null;
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => onSelect(b.id)}
                className="w-full rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-amber-200 transition hover:ring-amber-400"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold text-slate-900">
                    {b.name ?? "Unknown"}
                  </span>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                    Pending
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-700">
                  {start ? `${start.toFormat("ccc, LLL d")} · ${start.toFormat("h:mm a")}` : "—"}
                </div>
                <div className="text-xs text-slate-500">
                  {b.serviceLine} · {b.durationMin}m ·{" "}
                  {b.providerDisplayName || (
                    <span className="italic">First available</span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
