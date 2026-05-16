"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";
import type { PatientApiRow } from "@/lib/patient-types";
import { PatientProfileBody } from "@/app/admin/patients/_components/PatientProfileBody";

type Props = {
  open: boolean;
  getIdToken: () => Promise<string | null>;
  isSuperadmin: boolean;
  onClose: () => void;
};

export function PatientLookupPanel({ open, getIdToken, isSuperadmin, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<PatientApiRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadList = useCallback(async () => {
    if (!debounced) {
      setPatients([]);
      return;
    }
    const token = await getIdToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/patients?search=${encodeURIComponent(debounced)}&limit=30`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = (await res.json()) as { patients?: PatientApiRow[] };
      setPatients(data.patients ?? []);
    } finally {
      setLoading(false);
    }
  }, [debounced, getIdToken]);

  useEffect(() => {
    if (!open) return;
    void loadList();
  }, [open, loadList]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function formatAppt(ms: number | null): string {
    if (!ms) return "—";
    return DateTime.fromMillis(ms, { zone: TIME_ZONE }).toFormat("LLL d, yyyy");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="flex-1 bg-black/30"
        aria-label="Close patient lookup"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-[480px] flex-col border-l border-slate-200 bg-white shadow-xl sm:w-[480px]">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">
            {selectedId ? "Patient profile" : "Patient lookup"}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (selectedId) setSelectedId(null);
              else onClose();
            }}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {!selectedId ? (
          <>
            <div className="border-b border-slate-100 px-4 py-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, phone, or email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? <p className="px-4 py-6 text-sm text-slate-600">Searching…</p> : null}
              {!loading && debounced && patients.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-600">No patients found.</p>
              ) : null}
              <ul className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <p className="font-semibold text-slate-900">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-sm text-slate-600">{p.phone}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {p.totalVisits} visits · Next: {formatAppt(p.nextAppointmentDateMs)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <PatientProfileBody
              patientId={selectedId}
              getIdToken={getIdToken}
              isSuperadmin={isSuperadmin}
              compact
            />
            <Link
              href={`/admin/patients/${selectedId}`}
              className="mt-4 inline-block text-sm font-semibold text-[#0f5f5c] underline"
            >
              Open full profile
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
