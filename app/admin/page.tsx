"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { buildProviderStylesMap } from "@/lib/provider-colors";
import { buildServiceStylesMap } from "@/lib/service-calendar-styles";
import type { SchedulerServiceRow } from "@/lib/scheduler-service-types";
import {
  providerMatchesSchedulerBusiness,
  readSchedulerBusinessFromSession,
  SCHEDULER_BUSINESS_LABELS,
  writeSchedulerBusinessToSession,
  type SchedulerBusinessId,
} from "@/lib/scheduler-business";
import {
  bookingsApiQuery,
  chicagoDayStart,
  chicagoStartOfWeek,
  filterByBusiness,
  filterByService,
  pickColumnProviders,
  providerMatchesServiceScope,
  readFilters,
  todayChicagoIsoDate,
  writeFilters,
} from "./_scheduler/helpers";
import { openChiroSchedulerWindow } from "./_scheduler/open-chiro-window";
import { broadcastSchedulerSync, subscribeSchedulerSync } from "./_scheduler/scheduler-sync";
import type { SchedulerMode } from "./_scheduler/SchedulerChrome";
import {
  bookingStatusLabel,
  bookingStatusPillClasses,
  type BookingStatus,
} from "@/lib/booking-status";
import { BookingDrawer } from "./_scheduler/BookingDrawer";
import { NewBookingDrawer } from "./_scheduler/NewBookingDrawer";
import { BlockTimeDrawer } from "./_scheduler/BlockTimeDrawer";
import { HoldsTray, type HoldRow } from "./_scheduler/HoldsTray";
import { DayView, ListView, WeekView } from "./_scheduler/views";
import { CsvImportModal, type CsvImportDraft } from "./_scheduler/CsvImportModal";
import { PatientCsvImportModal } from "./_scheduler/PatientCsvImportModal";
import { PatientLookupPanel } from "./_scheduler/PatientLookupPanel";
import { SchedulerHeader, schedulerHeaderRoleLabel } from "./_scheduler/SchedulerChrome";
import { parseCsvRows } from "@/lib/csv-parse";
import { staffMeetsMin, type StaffRole } from "@/lib/staff-roles";

type Me = {
  authenticated: boolean;
  uid?: string;
  email?: string | null;
  role?: StaffRole | null;
  linkedProviderId?: string | null;
  capabilities?: {
    operations: boolean;
    siteContent: boolean;
    marketing: boolean;
    deskWrite: boolean;
  };
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isChiroWindow = pathname.startsWith("/admin/chiro");
  const schedulerMode: SchedulerMode = isChiroWindow ? "chiropractic" : "bodywork";
  const serviceScope = isChiroWindow ? "chiropractic" : "bodywork";
  const basePath = isChiroWindow ? "/admin/chiro" : "/admin";
  const [auth, setAuth] = useState<Auth | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [schedulerServices, setSchedulerServices] = useState<SchedulerServiceRow[]>([]);
  const [holds, setHolds] = useState<HoldRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [blockTimeOpen, setBlockTimeOpen] = useState(false);
  const [csvImportSkipConflict, setCsvImportSkipConflict] = useState(false);
  const [csvImportBusy, setCsvImportBusy] = useState(false);
  const [csvImportDraft, setCsvImportDraft] = useState<CsvImportDraft | null>(null);
  const csvImportInputRef = useRef<HTMLInputElement>(null);
  const seenBookingIdsRef = useRef<Set<string> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderPreview, setReminderPreview] = useState<{
    count: number;
    rows: { bookingId: string; name: string; phone: string; when: string }[];
  } | null>(null);
  const [reminderBusy, setReminderBusy] = useState<"preview" | "send" | null>(null);
  const [patientLookupOpen, setPatientLookupOpen] = useState(false);
  const [patientCsvImportOpen, setPatientCsvImportOpen] = useState(false);
  const [patientCsvImportBusy, setPatientCsvImportBusy] = useState(false);
  const [businessFilter, setBusinessFilter] = useState<SchedulerBusinessId>("all");

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  useEffect(() => {
    setBusinessFilter(readSchedulerBusinessFromSession());
  }, []);

  const filtersFromUrl = useMemo<FilterState>(
    () => readFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const filters = useMemo<FilterState>(
    () => ({ ...filtersFromUrl, business: businessFilter, serviceLine: serviceScope }),
    [filtersFromUrl, businessFilter, serviceScope],
  );

  const providerStyles = useMemo(() => buildProviderStylesMap(providers), [providers]);
  const serviceStyles = useMemo(
    () => buildServiceStylesMap(schedulerServices),
    [schedulerServices],
  );

  const getIdToken = useCallback(async (): Promise<string | null> => {
    const user = auth?.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }, [auth]);

  const updateFilters = useCallback(
    (patch: Partial<FilterState>) => {
      if (patch.business !== undefined) {
        setBusinessFilter(patch.business);
        writeSchedulerBusinessToSession(patch.business);
      }
      const next: FilterState = {
        ...filters,
        ...patch,
        business: patch.business ?? filters.business,
        serviceLine: serviceScope,
      };
      const qs = writeFilters(next);
      router.replace(qs ? `${basePath}?${qs}` : basePath);
      if (patch.date !== undefined || patch.locationId !== undefined) {
        broadcastSchedulerSync({ date: next.date, locationId: next.locationId });
      }
    },
    [filters, router, basePath, serviceScope],
  );

  useEffect(() => {
    return subscribeSchedulerSync((payload) => {
      if (payload.date === filters.date && payload.locationId === filters.locationId) return;
      const next: FilterState = {
        ...filters,
        date: payload.date,
        locationId: payload.locationId,
        serviceLine: serviceScope,
      };
      const qs = writeFilters(next);
      router.replace(qs ? `${basePath}?${qs}` : basePath);
    });
  }, [filters, router, basePath, serviceScope]);

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

  const refreshSchedulerServices = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/admin/scheduler-services", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const payload = (await res.json()) as { services?: SchedulerServiceRow[] };
    setSchedulerServices(payload.services ?? []);
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
      await refreshSchedulerServices();
      await refreshBookings();
      await refreshHolds();
    });
    return () => unsub();
  }, [auth, router, refreshBookings, refreshProviders, refreshSchedulerServices, refreshHolds]);

  useEffect(() => {
    if (!me?.role) return;
    refreshBookings();
    refreshHolds();
  }, [filters, me?.role, refreshBookings, refreshHolds]);

  useEffect(() => {
    if (me?.role !== "massage_therapist" || !me.linkedProviderId) return;
    if (filters.providerId !== me.linkedProviderId) {
      updateFilters({ providerId: me.linkedProviderId });
    }
  }, [me?.role, me?.linkedProviderId, filters.providerId, updateFilters]);

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus) {
      setSelectedId(focus);
    }
  }, [searchParams]);

  const viewBookings = useMemo(
    () => filterByBusiness(filterByService(bookings, filters.serviceLine), filters.business),
    [bookings, filters.serviceLine, filters.business],
  );

  const columnProviders = useMemo(
    () => pickColumnProviders(providers, filters),
    [providers, filters],
  );

  const scopedProviders = useMemo(
    () =>
      providers
        .filter((p) => p.active || filters.providerId === p.id)
        .filter((p) => providerMatchesServiceScope(p, serviceScope))
        .filter((p) =>
          filters.business === "all" ? true : providerMatchesSchedulerBusiness(p, filters.business),
        )
        .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName)),
    [providers, filters.providerId, serviceScope, filters.business],
  );

  /** Full list for New Appointment — drawer applies its own business filter. */
  const bookingDrawerProviders = useMemo(
    () =>
      providers
        .filter((p) => p.active)
        .filter((p) => providerMatchesServiceScope(p, serviceScope))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName)),
    [providers, serviceScope],
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

  const isOperationsManager = me?.role ? staffMeetsMin(me.role, "manager") : false;
  const isDeskWrite = me?.capabilities?.deskWrite ?? (me?.role ? staffMeetsMin(me.role, "front_desk") : false);
  return (
    <div className="min-h-screen bg-slate-50">
      <SchedulerHeader
        mode={schedulerMode}
        email={me?.email}
        roleLabel={schedulerHeaderRoleLabel(me?.role)}
        onOpenChiroWindow={
          !isChiroWindow
            ? () => openChiroSchedulerWindow({ date: filters.date, locationId: filters.locationId })
            : undefined
        }
        deskWrite={isDeskWrite}
        operations={isOperationsManager}
        loading={loading}
        patientCsvImportBusy={patientCsvImportBusy}
        csvImportBusy={csvImportBusy}
        csvImportSkipConflict={csvImportSkipConflict}
        onCsvImportSkipConflictChange={setCsvImportSkipConflict}
        onNewAppointment={() => setNewBookingOpen(true)}
        onBlockTime={() => setBlockTimeOpen(true)}
        onSendReminders={() => {
          setReminderOpen(true);
          setReminderPreview(null);
          void loadReminderPreview();
        }}
        onPatientLookup={() => setPatientLookupOpen(true)}
        onExportPatients={async () => {
          const token = await getIdToken();
          if (!token) return;
          setToastMessage("Preparing patient export…");
          const res = await fetch("/api/admin/patients/export", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            setToastMessage("Patient export failed.");
            return;
          }
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const date = new Date().toISOString().slice(0, 10);
          a.download = `patients_${date}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          setToastMessage("Patient export started");
        }}
        onImportPatients={() => setPatientCsvImportOpen(true)}
        onExportAppointments={async () => {
          const token = await getIdToken();
          if (!token) return;
          const { qs } = bookingsApiQuery(filters);
          const res = await fetch(`/api/admin/bookings/export?${qs}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            setToastMessage("Appointment export failed.");
            return;
          }
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `appointments-export.csv`;
          a.click();
          URL.revokeObjectURL(url);
          setToastMessage("Appointment export started");
        }}
        onImportAppointmentsClick={() => csvImportInputRef.current?.click()}
        onRefresh={() => void refreshBookings()}
        onSignOut={logout}
      />
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
          setError(null);
          setCsvImportBusy(true);
          try {
            const text = await f.text();
            const grid = parseCsvRows(text);
            if (grid.length < 2) {
              setError("CSV must include a header row and at least one data row.");
              return;
            }
            setCsvImportDraft({ file: f, headers: grid[0]!.map((c) => c.trim()) });
          } catch {
            setError("Could not read CSV file.");
          } finally {
            setCsvImportBusy(false);
          }
        }}
      />

      <main
        className={`mx-auto space-y-4 px-4 py-6 ${isChiroWindow ? "max-w-[100rem]" : "max-w-7xl"}`}
      >
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
              providers={scopedProviders}
              providerStyles={providerStyles}
              schedulerMode={schedulerMode}
              onChange={updateFilters}
            />

            {filters.view === "day" ? (
              <details className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <summary className="cursor-pointer font-semibold text-slate-700">
                  Day view legend
                </summary>
                <p className="mt-2 text-slate-500">
                  <span className="font-bold">✓</span> confirmed · <span className="font-bold">○</span>{" "}
                  pending · <span className="font-bold">✗</span> declined/cancelled · Colors use the
                  service type when set, otherwise the provider (Super Admin → Service types /
                  Providers). Same patient, multiple visits:{" "}
                  <span className="font-semibold">(2×)</span>.
                </p>
              </details>
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
                providerStyles={providerStyles}
                serviceStyles={serviceStyles}
                filters={filters}
                isManager={isOperationsManager}
                onSelect={setSelectedId}
                onRescheduleBooking={isOperationsManager ? handleRescheduleBooking : undefined}
                onInvalidCrossProviderDrop={handleInvalidCrossProviderDrop}
                onInvalidCrossPatientTimeDrop={handleInvalidCrossPatientTimeDrop}
              />
            ) : null}
            {filters.view === "week" ? (
              <WeekView
                bookings={viewBookings}
                providers={scopedProviders}
                providerStyles={providerStyles}
                serviceStyles={serviceStyles}
                filters={filters}
                onSelect={setSelectedId}
              />
            ) : null}
            {filters.view === "list" ? (
              <ListView
                bookings={viewBookings}
                providers={scopedProviders}
                providerStyles={providerStyles}
                serviceStyles={serviceStyles}
                filters={filters}
                isManager={isOperationsManager}
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
        readOnly={!isDeskWrite}
      />

      <NewBookingDrawer
        open={newBookingOpen}
        onClose={() => setNewBookingOpen(false)}
        onCreated={async () => {
          await refreshBookings();
        }}
        getIdToken={getIdToken}
        providers={bookingDrawerProviders}
        defaultDate={filters.date}
        defaultBusiness={
          filters.business === "all" ? undefined : filters.business
        }
        schedulerMode={schedulerMode}
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

      <CsvImportModal
        draft={csvImportDraft}
        skipConflict={csvImportSkipConflict}
        busy={csvImportBusy}
        onBusy={setCsvImportBusy}
        getIdToken={getIdToken}
        onDismiss={() => setCsvImportDraft(null)}
        onImported={refreshBookings}
        setParentError={setError}
      />
      <PatientCsvImportModal
        open={patientCsvImportOpen}
        getIdToken={getIdToken}
        onDismiss={() => setPatientCsvImportOpen(false)}
        onBusy={setPatientCsvImportBusy}
      />
      <PatientLookupPanel
        open={patientLookupOpen}
        getIdToken={getIdToken}
        isSuperadmin={me?.role ? staffMeetsMin(me.role, "manager") : false}
        onClose={() => setPatientLookupOpen(false)}
      />
    </div>
  );
}

/* ---------------- Toolbar ---------------- */

function Toolbar({
  filters,
  providers,
  providerStyles,
  schedulerMode,
  onChange,
}: {
  filters: FilterState;
  providers: ProviderRow[];
  providerStyles: Map<string, import("@/lib/provider-colors").ProviderCalendarStyle>;
  schedulerMode: SchedulerMode;
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
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 pb-4">
        <label className="inline-flex min-w-[12rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Business
          <select
            value={filters.business}
            onChange={(e) => onChange({ business: e.target.value as SchedulerBusinessId })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
          >
            {(Object.keys(SCHEDULER_BUSINESS_LABELS) as SchedulerBusinessId[]).map((id) => (
              <option key={id} value={id}>
                {SCHEDULER_BUSINESS_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-slate-500">
          Filters day, week, list, and reports appointment lookup. Saved in this browser session.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
          {(["day", "week", "list"] as SchedulerView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 font-semibold transition ${
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
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:border-slate-400"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goToday}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm font-semibold hover:border-slate-400"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftDate(1)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:border-slate-400"
                aria-label="Next"
              >
                ›
              </button>
              <span className="text-sm font-semibold text-slate-900">{dateLabel}</span>
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

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-center gap-3">
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
            label="Provider"
            value={filters.providerId}
            options={[
              { v: "all", l: "All providers" },
              ...providers.map((p) => ({ v: p.id, l: p.displayName })),
            ]}
            onChange={(v) => onChange({ providerId: v })}
          />
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {schedulerMode === "chiropractic" ? "Chiropractic only" : "Massage & stretch"}
          </span>
        </div>
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search name, phone, email…"
          className="w-full min-w-[12rem] max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm sm:w-56"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
          <span className="mx-1 text-slate-300">|</span>
          <button
            type="button"
            onClick={setAllStatuses}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            All
          </button>
          <button
            type="button"
            onClick={resetStatuses}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Active only
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Provider colors
          </span>
          {providers.slice(0, 8).map((p) => {
            const style = providerStyles.get(p.id);
            return (
              <span key={p.id} className="inline-flex items-center gap-1 text-xs text-slate-700">
                <span
                  className="inline-block h-3 w-3 rounded border border-black/10"
                  style={style?.style}
                />
                {p.displayName.split(/\s+/)[0]}
              </span>
            );
          })}
          {providers.length > 8 ? (
            <span className="text-xs text-slate-500">+{providers.length - 8} more</span>
          ) : null}
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
