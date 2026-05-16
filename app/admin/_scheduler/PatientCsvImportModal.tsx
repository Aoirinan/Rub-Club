"use client";

import { useCallback, useState } from "react";

type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

type Props = {
  open: boolean;
  getIdToken: () => Promise<string | null>;
  onDismiss: () => void;
  onBusy?: (busy: boolean) => void;
};

export function PatientCsvImportModal({ open, getIdToken, onDismiss, onBusy }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setBusyState = useCallback(
    (v: boolean) => {
      setBusy(v);
      onBusy?.(v);
    },
    [onBusy],
  );

  if (!open) return null;

  async function runImport() {
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }
    const token = await getIdToken();
    if (!token) {
      setError("Sign in to import.");
      return;
    }
    setError(null);
    setResult(null);
    setBusyState(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      if (updateExisting) fd.set("updateExisting", "true");
      const res = await fetch("/api/admin/patients/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Import failed.");
        return;
      }
      setResult(data);
    } catch {
      setError("Import failed.");
    } finally {
      setBusyState(false);
    }
  }

  function close() {
    setFile(null);
    setResult(null);
    setError(null);
    onDismiss();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-csv-import-title"
      >
        <h2 id="patient-csv-import-title" className="text-lg font-semibold text-slate-900">
          Import patients from CSV
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Upload a spreadsheet with patient contact info. Existing patients are matched by phone number.
        </p>

        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              className="mt-1 block w-full text-sm"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
                setError(null);
              }}
            />
          </label>

          <p className="text-sm">
            <button
              type="button"
              className="font-semibold text-[#0f5f5c] underline"
              onClick={async () => {
                const token = await getIdToken();
                if (!token) return;
                const res = await fetch("/api/admin/patients/template", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "patients_import_template.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download CSV template
            </button>
          </p>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="rounded border-slate-300"
            />
            Update existing patients if phone number matches
          </label>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {error}
            </p>
          ) : null}

          {result ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950">
              <p className="font-semibold">
                Import complete: {result.created} created, {result.updated} updated, {result.skipped}{" "}
                skipped
              </p>
              {result.errors.length > 0 ? (
                <ul className="mt-2 max-h-32 list-disc overflow-y-auto pl-5 text-rose-900">
                  {result.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            disabled={busy || !file}
            onClick={() => void runImport()}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
