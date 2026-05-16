"use client";

import { useCallback, useEffect, useState } from "react";
import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";
import type { PatientApiRow } from "@/lib/patient-types";
import {
  deriveVisitDisplayStatus,
  visitDisplayStatusClasses,
  visitDisplayStatusLabel,
} from "@/lib/patient-visit-display";

type BookingRow = Record<string, unknown> & {
  id?: string;
  startAtMs?: number | null;
  serviceLine?: string;
  providerDisplayName?: string;
  status?: string;
  notes?: string;
  internalNotes?: string;
  paidAmountCents?: number | null;
  checkedInAtMs?: number | null;
};

type Props = {
  patientId: string;
  getIdToken: () => Promise<string | null>;
  isSuperadmin: boolean;
  compact?: boolean;
};

export function PatientProfileBody({ patientId, getIdToken, isSuperadmin, compact }: Props) {
  const [patient, setPatient] = useState<PatientApiRow | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [form, setForm] = useState<Partial<PatientApiRow>>({});
  const [apptPage, setApptPage] = useState(0);
  const pageSize = 20;

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/patients/${encodeURIComponent(patientId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        patient?: PatientApiRow;
        bookings?: BookingRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not load patient.");
        return;
      }
      setPatient(data.patient ?? null);
      setBookings(data.bookings ?? []);
      setNotesDraft(data.patient?.notes ?? "");
      setForm(data.patient ?? {});
    } finally {
      setLoading(false);
    }
  }, [getIdToken, patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveNotes() {
    if (!isSuperadmin) return;
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch(`/api/admin/patients/${encodeURIComponent(patientId)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesDraft }),
    });
    if (res.ok) void load();
  }

  async function saveEdit() {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch(`/api/admin/patients/${encodeURIComponent(patientId)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setEditing(false);
      void load();
    }
  }

  async function uploadInsurance(side: "front" | "back", file: File) {
    const token = await getIdToken();
    if (!token) return;
    const fd = new FormData();
    fd.set("side", side);
    fd.set("file", file);
    const res = await fetch(`/api/admin/patients/${encodeURIComponent(patientId)}/insurance`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (res.ok) void load();
  }

  if (loading) return <p className="text-sm text-slate-600">Loading…</p>;
  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!patient) return <p className="text-sm text-slate-600">Patient not found.</p>;

  const apptSlice = bookings.slice(apptPage * pageSize, (apptPage + 1) * pageSize);
  const apptPages = Math.max(1, Math.ceil(bookings.length / pageSize));

  const paymentBadge =
    patient.paymentType === "insurance"
      ? "bg-blue-100 text-blue-900"
      : patient.paymentType === "mixed"
        ? "bg-violet-100 text-violet-900"
        : "bg-emerald-100 text-emerald-900";

  return (
    <div className={compact ? "space-y-4" : "grid gap-6 lg:grid-cols-2"}>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900">
            {patient.firstName} {patient.lastName}
          </h1>
          {isSuperadmin && !editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-50"
            >
              Edit patient
            </button>
          ) : null}
        </div>

        {editing ? (
          <div className="space-y-2 text-sm">
            {(
              [
                ["firstName", "First name"],
                ["lastName", "Last name"],
                ["phone", "Phone"],
                ["email", "Email"],
                ["dateOfBirth", "Date of birth"],
                ["address", "Address"],
                ["city", "City"],
                ["state", "State"],
                ["zip", "Zip"],
                ["insuranceCarrier", "Insurance carrier"],
                ["insuranceMemberId", "Member ID"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-medium text-slate-600">{label}</span>
                <input
                  className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                  value={String(form[key] ?? "")}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </label>
            ))}
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Payment type</span>
              <select
                className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1"
                value={form.paymentType ?? "cash"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    paymentType: e.target.value as PatientApiRow["paymentType"],
                  }))
                }
              >
                <option value="cash">Cash</option>
                <option value="insurance">Insurance</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => void saveEdit()}
                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setForm(patient);
                }}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <dl className="space-y-2 text-sm text-slate-700">
            <div>
              <dt className="text-xs text-slate-500">Phone</dt>
              <dd>
                <a href={`tel:${patient.phone}`} className="font-medium text-[#0f5f5c]">
                  {patient.phone}
                </a>
              </dd>
            </div>
            {patient.email ? (
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd>{patient.email}</dd>
              </div>
            ) : null}
            {patient.dateOfBirth ? (
              <div>
                <dt className="text-xs text-slate-500">Date of birth</dt>
                <dd>{patient.dateOfBirth}</dd>
              </div>
            ) : null}
            {patient.address ? (
              <div>
                <dt className="text-xs text-slate-500">Address</dt>
                <dd>
                  {patient.address}
                  {patient.city ? `, ${patient.city}` : ""}
                  {patient.state ? ` ${patient.state}` : ""}
                  {patient.zip ? ` ${patient.zip}` : ""}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-slate-500">Payment</dt>
              <dd>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${paymentBadge}`}>
                  {patient.paymentType}
                </span>
              </dd>
            </div>
            {patient.insuranceCarrier ? (
              <div>
                <dt className="text-xs text-slate-500">Insurance</dt>
                <dd>
                  {patient.insuranceCarrier}
                  {patient.insuranceMemberId ? ` · ${patient.insuranceMemberId}` : ""}
                </dd>
              </div>
            ) : null}
          </dl>
        )}

        {(patient.insuranceCardFront || patient.insuranceCardBack) && !editing ? (
          <div className="flex gap-2">
            {patient.insuranceCardFront ? (
              <a href={patient.insuranceCardFront} target="_blank" rel="noreferrer">
                <img
                  src={patient.insuranceCardFront}
                  alt="Insurance front"
                  className="h-20 w-32 rounded border object-cover"
                />
              </a>
            ) : null}
            {patient.insuranceCardBack ? (
              <a href={patient.insuranceCardBack} target="_blank" rel="noreferrer">
                <img
                  src={patient.insuranceCardBack}
                  alt="Insurance back"
                  className="h-20 w-32 rounded border object-cover"
                />
              </a>
            ) : null}
          </div>
        ) : null}

        {isSuperadmin && !editing ? (
          <label className="block text-xs font-semibold text-slate-700">
            Upload insurance card
            <input
              type="file"
              accept="image/*"
              className="mt-1 block text-xs"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadInsurance("front", f);
              }}
            />
            <input
              type="file"
              accept="image/*"
              className="mt-1 block text-xs"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadInsurance("back", f);
              }}
            />
          </label>
        ) : null}

        <label className="block text-sm">
          <span className="text-xs font-medium text-slate-500">Internal notes</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            rows={3}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={() => void saveNotes()}
            readOnly={!isSuperadmin}
          />
        </label>
      </section>

      <section className={compact ? "space-y-4" : "space-y-4 lg:col-span-1"}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["totalVisits", "Visits", "text-emerald-600"],
              ["totalCanceled", "Canceled", "text-rose-600"],
              ["totalNoShow", "No shows", "text-orange-600"],
              ["totalConfirmed", "Confirmed", "text-teal-600"],
            ] as const
          ).map(([key, label, color]) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className={`text-2xl font-bold ${color}`}>{patient[key]}</p>
              <p className="text-xs text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Appointment history</h2>
          </header>
          {bookings.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-600">No appointments yet</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Service</th>
                      <th className="px-3 py-2">Provider</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {apptSlice.map((b) => {
                      const ms = typeof b.startAtMs === "number" ? b.startAtMs : null;
                      const dt = ms ? DateTime.fromMillis(ms, { zone: TIME_ZONE }) : null;
                      const display = deriveVisitDisplayStatus({
                        status: typeof b.status === "string" ? b.status : undefined,
                        startAtMs: ms,
                        checkedInAtMs: b.checkedInAtMs,
                      });
                      const paid =
                        typeof b.paidAmountCents === "number"
                          ? `$${(b.paidAmountCents / 100).toFixed(2)}`
                          : "—";
                      return (
                        <tr key={String(b.id)}>
                          <td className="px-3 py-2">{dt?.toFormat("LLL d, yyyy") ?? "—"}</td>
                          <td className="px-3 py-2">{dt?.toFormat("h:mm a") ?? "—"}</td>
                          <td className="px-3 py-2 capitalize">{String(b.serviceLine ?? "—")}</td>
                          <td className="px-3 py-2">{String(b.providerDisplayName ?? "—")}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 font-semibold ${visitDisplayStatusClasses(display)}`}
                            >
                              {visitDisplayStatusLabel(display)}
                            </span>
                          </td>
                          <td className="px-3 py-2">{paid}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {apptPages > 1 ? (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
                  <button
                    type="button"
                    disabled={apptPage === 0}
                    onClick={() => setApptPage((p) => p - 1)}
                    className="text-xs font-semibold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-600">
                    Page {apptPage + 1} of {apptPages}
                  </span>
                  <button
                    type="button"
                    disabled={apptPage >= apptPages - 1}
                    onClick={() => setApptPage((p) => p + 1)}
                    className="text-xs font-semibold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
