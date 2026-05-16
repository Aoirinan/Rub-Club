"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { TIME_ZONE } from "@/lib/constants";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import type { PatientApiRow, PatientPaymentType } from "@/lib/patient-types";

function formatDate(ms: number | null): string {
  if (!ms) return "—";
  return DateTime.fromMillis(ms, { zone: TIME_ZONE }).toFormat("LLL d, yyyy");
}

export default function PatientsListPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-slate-600">Loading…</div>}>
      <PatientsListContent />
    </Suspense>
  );
}

function PatientsListContent() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [meRole, setMeRole] = useState<"admin" | "superadmin" | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PatientPaymentType | "all">("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [patients, setPatients] = useState<PatientApiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    paymentType: "cash" as PatientPaymentType,
  });
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const getIdToken = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` } });
      const data = (await res.json()) as { role?: string };
      if (data.role === "admin" || data.role === "superadmin") setMeRole(data.role);
    });
    return () => unsub();
  }, [auth, router]);

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debounced) params.set("search", debounced);
      if (paymentFilter !== "all") params.set("paymentType", paymentFilter);
      if (activeOnly) params.set("active", "true");
      params.set("limit", "100");
      const res = await fetch(`/api/admin/patients?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { patients?: PatientApiRow[] };
      setPatients(data.patients ?? []);
    } finally {
      setLoading(false);
    }
  }, [debounced, paymentFilter, activeOnly, getIdToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const isSuperadmin = meRole === "superadmin";

  async function createPatient() {
    setAddError(null);
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/admin/patients", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setAddError(typeof data.error === "string" ? data.error : "Could not create patient.");
      return;
    }
    setAddOpen(false);
    setAddForm({ firstName: "", lastName: "", phone: "", email: "", paymentType: "cash" });
    void load();
  }

  async function softDelete(id: string) {
    if (!confirm("Soft-delete this patient?")) return;
    const token = await getIdToken();
    if (!token) return;
    await fetch(`/api/admin/patients/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    void load();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Patients</h1>
            <p className="text-xs text-slate-500">Profiles, visit history, and imports</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
              Scheduler
            </Link>
            {isSuperadmin ? (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                + Add patient
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Search name, phone, or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PatientPaymentType | "all")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All payment types</option>
            <option value="cash">Cash</option>
            <option value="insurance">Insurance</option>
            <option value="mixed">Mixed</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
            Active only
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? <p className="px-4 py-8 text-sm text-slate-600">Loading…</p> : null}
          {!loading && patients.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-600">
              No patients yet. Import a CSV or add a patient manually.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Visits</th>
                  <th className="px-4 py-3 hidden md:table-cell">Last visit</th>
                  <th className="px-4 py-3 hidden md:table-cell">Next appt</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => router.push(`/admin/patients/${p.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-4 py-3">{p.phone}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{p.email || "—"}</td>
                    <td className="px-4 py-3 capitalize">{p.paymentType}</td>
                    <td className="px-4 py-3">{p.totalVisits}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{formatDate(p.lastVisitDateMs)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{formatDate(p.nextAppointmentDateMs)}</td>
                    {isSuperadmin ? (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/admin/patients/${p.id}`} className="mr-2 text-xs font-semibold text-[#0f5f5c]">
                          View
                        </Link>
                        <button
                          type="button"
                          className="text-xs font-semibold text-rose-700"
                          onClick={() => void softDelete(p.id)}
                        >
                          Delete
                        </button>
                      </td>
                    ) : (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/admin/patients/${p.id}`} className="text-xs font-semibold text-[#0f5f5c]">
                          View
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {addOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <aside className="h-full w-full max-w-md border-l border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Add patient</h2>
            <div className="mt-4 space-y-3 text-sm">
              {(["firstName", "lastName", "phone", "email"] as const).map((key) => (
                <label key={key} className="block">
                  <span className="text-xs font-medium capitalize text-slate-600">{key}</span>
                  <input
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                    value={addForm[key]}
                    onChange={(e) => setAddForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </label>
              ))}
              {addError ? <p className="text-rose-700">{addError}</p> : null}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => void createPatient()}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Save patient
                </button>
                <button type="button" onClick={() => setAddOpen(false)} className="rounded-full border px-4 py-2 text-sm">
                  Cancel
                </button>
              </div>
            </div>
            <button type="button" className="absolute right-4 top-4" onClick={() => setAddOpen(false)}>
              ✕
            </button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
