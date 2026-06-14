"use client";

// Signatures and body diagrams are base64 PNG data URLs rendered as-is; next/image
// optimization does not apply, so plain <img> is intentional here.
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { IntakeSubmissionRecord, IntakeSubmissionStatus } from "@/lib/intakeForms/types";
import { getFormDefinition, flattenFields } from "@/lib/intakeForms/definitions";
import { groupedAnswerRows, submissionPatientName } from "@/lib/intakeForms/display";
import { adminFetch } from "./authFetch";

type ListItem = {
  id: string;
  patientName: string;
  status: IntakeSubmissionStatus;
  submittedAt: string | null;
};

const STATUS_FILTERS: Array<IntakeSubmissionStatus | "all"> = ["all", "new", "reviewed", "archived"];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SubmissionsBrowser({ slug }: { slug: string }) {
  const def = getFormDefinition(slug);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<IntakeSubmissionStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [selected, setSelected] = useState<IntakeSubmissionRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(
        `/api/admin/online-forms/submissions?slug=${encodeURIComponent(slug)}&status=${statusFilter}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { submissions: ListItem[] };
        setItems(data.submissions);
      }
    } finally {
      setLoading(false);
    }
  }, [slug, statusFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await adminFetch(`/api/admin/online-forms/submissions/${id}`);
      if (res.ok) {
        const data = (await res.json()) as { submission: IntakeSubmissionRecord };
        setSelected(data.submission);
      }
    } finally {
      setDetailLoading(false);
    }
  }

  async function setStatus(id: string, status: IntakeSubmissionStatus) {
    const res = await adminFetch(`/api/admin/online-forms/submissions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      await loadList();
    }
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? items.filter((i) => i.patientName.toLowerCase().includes(term))
      : items;
    const sorted = [...filtered].sort((a, b) => {
      const av = a.submittedAt ?? "";
      const bv = b.submittedAt ?? "";
      return sortNewestFirst ? bv.localeCompare(av) : av.localeCompare(bv);
    });
    return sorted;
  }, [items, search, sortNewestFirst]);

  if (!def) {
    return <p className="px-4 py-10 text-sm text-red-700">Unknown form.</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #print-area, #print-area * { visibility: visible !important; }
        #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
      }`}</style>

      <header className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/super/online-forms" className="text-sm font-semibold text-slate-600 hover:underline">
            ← Online forms
          </Link>
          <h1 className="text-2xl font-black text-slate-900">{def.title} — Submissions</h1>
        </div>
        <a
          href={`/api/admin/online-forms/submissions/export?slug=${encodeURIComponent(slug)}`}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Download CSV
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        {/* List */}
        <div className="no-print space-y-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                  statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setSortNewestFirst((v) => !v)}
            className="text-xs font-semibold text-slate-600 hover:underline"
          >
            Sort: {sortNewestFirst ? "Newest first" : "Oldest first"}
          </button>

          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="text-sm text-slate-500">No submissions.</p>
          ) : (
            <ul className="space-y-2">
              {visible.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(item.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left ${
                      selected?.id === item.id
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className="block font-semibold text-slate-900">{item.patientName}</span>
                    <span className="block text-xs text-slate-500">{fmtDate(item.submittedAt)}</span>
                    <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                      {item.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail */}
        <div>
          {detailLoading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : selected ? (
            <SubmissionDetail
              submission={selected}
              onSetStatus={setStatus}
              onPrint={() => window.print()}
            />
          ) : (
            <p className="text-sm text-slate-500">Select a submission to view it.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmissionDetail({
  submission,
  onSetStatus,
  onPrint,
}: {
  submission: IntakeSubmissionRecord;
  onSetStatus: (id: string, status: IntakeSubmissionStatus) => void;
  onPrint: () => void;
}) {
  const def = getFormDefinition(submission.formSlug);
  if (!def) return null;
  const groups = groupedAnswerRows(def, submission.answers);
  const signatureFields = flattenFields(def).filter((f) => f.type === "signature-block");
  const diagramFields = flattenFields(def).filter((f) => f.type === "body-diagram");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSetStatus(submission.id, "reviewed")}
            className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Mark reviewed
          </button>
          <button
            type="button"
            onClick={() => onSetStatus(submission.id, "archived")}
            className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
          >
            Archive
          </button>
        </div>
        <button
          type="button"
          onClick={onPrint}
          className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Print
        </button>
      </div>

      <div id="print-area" className="space-y-6 px-5 py-5">
        <div>
          <h2 className="text-xl font-black text-slate-900">{submission.formTitle}</h2>
          <p className="text-sm text-slate-600">{submissionPatientName(submission.answers)}</p>
          <p className="text-xs text-slate-500">
            Submitted {fmtDate(submission.meta.submittedAt)} · Status: {submission.status}
          </p>
        </div>

        {groups.map((group) => {
          const rows = group.rows.filter((r) => r.value !== "");
          if (rows.length === 0) return null;
          return (
            <section key={group.title}>
              <h3 className="border-b border-slate-200 pb-1 text-sm font-black uppercase tracking-wide text-slate-700">
                {group.title}
              </h3>
              <dl className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {rows.map((row) => (
                  <div key={row.id}>
                    <dt className="text-xs font-semibold text-slate-500">{row.label}</dt>
                    <dd className="text-sm text-slate-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}

        {diagramFields.map((f) => {
          const diag = submission.diagrams[f.id];
          if (!diag || (!diag.frontImage && !diag.backImage)) return null;
          return (
            <section key={f.id}>
              <h3 className="border-b border-slate-200 pb-1 text-sm font-black uppercase tracking-wide text-slate-700">
                {f.label}
              </h3>
              <div className="mt-2 flex flex-wrap gap-4">
                {diag.frontImage ? (
                  <img src={diag.frontImage} alt="Front body diagram" className="h-64 w-auto rounded border border-slate-200" />
                ) : null}
                {diag.backImage ? (
                  <img src={diag.backImage} alt="Back body diagram" className="h-64 w-auto rounded border border-slate-200" />
                ) : null}
              </div>
            </section>
          );
        })}

        {signatureFields.map((f) => {
          const sig = submission.signatures[f.id];
          if (!sig) return null;
          return (
            <section key={f.id}>
              <h3 className="border-b border-slate-200 pb-1 text-sm font-black uppercase tracking-wide text-slate-700">
                {f.label}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-slate-900">
                {sig.signatureImage ? (
                  <img src={sig.signatureImage} alt="Signature" className="h-24 w-auto rounded border border-slate-200 bg-white" />
                ) : sig.typedName ? (
                  <p className="text-lg" style={{ fontFamily: "cursive" }}>{sig.typedName}</p>
                ) : (
                  <p className="text-slate-400">No signature</p>
                )}
                {sig.printedName ? <p><span className="text-slate-500">Printed name:</span> {sig.printedName}</p> : null}
                {sig.email ? <p><span className="text-slate-500">Email:</span> {sig.email}</p> : null}
                {sig.dateSigned ? <p><span className="text-slate-500">Date signed:</span> {sig.dateSigned}</p> : null}
              </div>
            </section>
          );
        })}

        <section className="border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p>Consent accepted: {submission.consentAccepted ? "Yes" : "No"}</p>
          {submission.consentLabelAtSubmit ? <p>Consent text shown: “{submission.consentLabelAtSubmit}”</p> : null}
          <p>IP address: {submission.meta.ipAddress || "—"}</p>
        </section>
      </div>
    </div>
  );
}
