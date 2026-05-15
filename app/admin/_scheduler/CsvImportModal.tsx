"use client";

import { useEffect, useState } from "react";
import {
  CSV_IMPORT_COLUMN_KEYS,
  CSV_IMPORT_FIELD_LABELS,
  type CsvImportColumnKey,
  buildColMap,
  guessCsvImportSelections,
  normHeader,
} from "@/lib/csv-import-columns";

const AUTO = "__auto__" as const;

export type CsvImportDraft = { file: File; headers: string[] };

type Props = {
  draft: CsvImportDraft | null;
  skipConflict: boolean;
  busy: boolean;
  onBusy: (v: boolean) => void;
  getIdToken: () => Promise<string | null>;
  onDismiss: () => void;
  onImported: () => Promise<void>;
  setParentError: (s: string | null) => void;
};

const REQUIRED_KEYS: CsvImportColumnKey[] = ["name", "service", "duration", "location", "provider", "providerId"];
const WHEN_KEYS: CsvImportColumnKey[] = ["date", "time", "startIso"];
const OPTIONAL_KEYS: CsvImportColumnKey[] = ["phone", "email", "status", "notes", "bookingId"];

export function CsvImportModal(props: Props) {
  const { draft, skipConflict, busy, onBusy, getIdToken, onDismiss, onImported, setParentError } = props;
  const [selections, setSelections] = useState<Record<CsvImportColumnKey, typeof AUTO | string>>(() => {
    const init = {} as Record<CsvImportColumnKey, typeof AUTO | string>;
    for (const k of CSV_IMPORT_COLUMN_KEYS) init[k] = AUTO;
    return init;
  });
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) return;
    const g = guessCsvImportSelections(draft.headers);
    const next = {} as Record<CsvImportColumnKey, typeof AUTO | string>;
    for (const key of CSV_IMPORT_COLUMN_KEYS) {
      const guessed = g[key];
      const match = guessed && draft.headers.some((h) => normHeader(h) === normHeader(guessed));
      next[key] = match ? guessed : AUTO;
    }
    setSelections(next);
    setLocalError(null);
  }, [draft]);

  if (!draft) return null;
  const csvDraft = draft;

  async function runImport() {
    setLocalError(null);
    setParentError(null);
    const overrides: Partial<Record<CsvImportColumnKey, string>> = {};
    for (const key of CSV_IMPORT_COLUMN_KEYS) {
      const v = selections[key];
      if (v && v !== AUTO) overrides[key] = v;
    }
    const mapped = buildColMap(csvDraft.headers, Object.keys(overrides).length ? overrides : undefined);
    if ("error" in mapped) {
      setLocalError(mapped.error);
      return;
    }

    const token = await getIdToken();
    if (!token) {
      setParentError("Sign in to import.");
      return;
    }
    onBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", csvDraft.file);
      if (Object.keys(overrides).length) fd.append("columnMap", JSON.stringify(overrides));
      if (skipConflict) fd.append("skipConflictCheck", "true");
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
        setParentError(typeof data.error === "string" ? data.error : "CSV import failed.");
        return;
      }
      const errLines = data.errors?.slice(0, 12).map((x) => `Row ${x.row}: ${x.message}`) ?? [];
      const skipN = data.skipped?.length ?? 0;
      const msg = [
        `Imported ${data.created ?? 0} of ${data.totalRows ?? 0} row(s).`,
        skipN ? `Skipped ${skipN} row(s) (e.g. existing booking IDs).` : "",
        errLines.length ? `Issues:\n${errLines.join("\n")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      window.alert(msg);
      onDismiss();
      await onImported();
    } finally {
      onBusy(false);
    }
  }

  function row(key: CsvImportColumnKey) {
    return (
      <label key={key} className="grid grid-cols-[minmax(0,140px)_1fr] items-center gap-2 text-sm">
        <span className="text-slate-600">{CSV_IMPORT_FIELD_LABELS[key]}</span>
        <select
          value={selections[key]}
          onChange={(e) => setSelections((s) => ({ ...s, [key]: e.target.value }))}
          className="min-w-0 rounded-lg border border-slate-300 px-2 py-1.5 text-slate-900"
        >
          <option value={AUTO}>Auto-detect</option>
          {csvDraft.headers.map((h, i) => (
            <option key={`${i}-${h}`} value={h}>
              {h}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-import-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onDismiss();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="csv-import-title" className="text-lg font-semibold text-slate-900">
          Map CSV columns
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          File: <span className="font-medium">{csvDraft.file.name}</span>. Choose which column supplies each value, or use
          Auto-detect when the header is already recognized.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Use either Date + Time (Chicago) or Start (UTC ISO). At least one of provider name or provider ID must map to
          a column.
        </p>

        {localError ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {localError}
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Required</p>
            <div className="space-y-2">{REQUIRED_KEYS.map(row)}</div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">When</p>
            <div className="space-y-2">{WHEN_KEYS.map(row)}</div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Optional</p>
            <div className="space-y-2">{OPTIONAL_KEYS.map(row)}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            onClick={onDismiss}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            onClick={() => void runImport()}
            disabled={busy}
          >
            {busy ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
