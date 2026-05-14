"use client";

import { useCallback, useEffect, useState } from "react";

type IntakeListItem = {
  id: string;
  submittedAt: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  hasInsuranceCard: boolean;
  hasDriversLicense: boolean;
};

type FileSummary = {
  contentType: string;
  originalFilename: string;
  bytes: number;
  uploadedAt: string | null;
} | null;

type IntakeDetail = Record<string, unknown> & {
  id: string;
  insuranceCard: FileSummary;
  driversLicense: FileSummary;
};

type AccessLogRow = {
  id: string;
  at: string | null;
  actorUid: string;
  actorEmail: string | null;
  action: string;
  documentKey: string | null;
  ip: string | null;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function actionLabel(action: string): string {
  if (action === "detail_view") return "Opened intake record";
  if (action === "document_inline") return "Viewed document (browser)";
  if (action === "document_download") return "Downloaded document";
  return action;
}

export function IntakePhiSection(props: { getIdToken: () => Promise<string> }) {
  const [rows, setRows] = useState<IntakeListItem[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IntakeDetail | null>(null);
  const [accessLog, setAccessLog] = useState<AccessLogRow[]>([]);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [docBusy, setDocBusy] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setListError(null);
    setLoadingList(true);
    try {
      const token = await props.getIdToken();
      const res = await fetch("/api/admin/intake-forms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { items?: IntakeListItem[]; error?: string };
      if (!res.ok) {
        setListError(typeof data.error === "string" ? data.error : "Could not load intake list.");
        setRows([]);
        return;
      }
      setRows(data.items ?? []);
    } finally {
      setLoadingList(false);
    }
  }, [props]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function openDetail(id: string, opts?: { recordAccess?: boolean }) {
    const recordAccess = opts?.recordAccess !== false;
    setOpenId(id);
    setDetail(null);
    setAccessLog([]);
    setDetailError(null);
    setLoadingDetail(true);
    try {
      const token = await props.getIdToken();
      const q = recordAccess ? "" : "?recordAccess=0";
      const res = await fetch(`/api/admin/intake-forms/${encodeURIComponent(id)}${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as {
        intake?: IntakeDetail;
        accessLog?: AccessLogRow[];
        error?: string;
      };
      if (!res.ok) {
        setDetailError(typeof data.error === "string" ? data.error : "Could not load intake.");
        return;
      }
      setDetail(data.intake ?? null);
      setAccessLog(data.accessLog ?? []);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function openDocument(
    intakeId: string,
    document: "insurance" | "drivers_license",
    mode: "inline" | "download",
  ) {
    const busyKey = `${intakeId}:${document}:${mode}`;
    setDocBusy(busyKey);
    try {
      const token = await props.getIdToken();
      const res = await fetch(`/api/admin/intake-forms/${encodeURIComponent(intakeId)}/document`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ document, mode }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        window.alert(typeof data.error === "string" ? data.error : "Could not open document.");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
      if (openId === intakeId) {
        await openDetail(intakeId, { recordAccess: false });
      }
    } finally {
      setDocBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Intake forms with uploads</h2>
          <p className="mt-1 text-sm text-slate-600">
            Online intake submissions. Opening a record or viewing/downloading an insurance card or
            ID is <strong>logged</strong> (who, when, and network hint) under each submission.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadList()}
          disabled={loadingList}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
        >
          {loadingList ? "Refreshing…" : "Refresh list"}
        </button>
      </div>

      {listError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {listError}
        </p>
      ) : null}

      {rows.length === 0 && !loadingList && !listError ? (
        <p className="text-sm text-slate-600">No intake forms found yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {rows.map((row) => {
            const expanded = openId === row.id;
            return (
              <li key={row.id} className="bg-white">
                <button
                  type="button"
                  onClick={() => (expanded ? setOpenId(null) : void openDetail(row.id))}
                  className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">
                    {row.lastName}, {row.firstName}
                  </span>
                  <span className="text-xs text-slate-500">{formatWhen(row.submittedAt)}</span>
                  <span className="w-full text-xs text-slate-600 sm:w-auto">
                    {row.hasInsuranceCard ? "Insurance file · " : ""}
                    {row.hasDriversLicense ? "ID file" : ""}
                    {!row.hasInsuranceCard && !row.hasDriversLicense ? "No uploads" : ""}
                  </span>
                </button>
                {expanded ? (
                  <div className="space-y-4 border-t border-slate-100 bg-slate-50/80 px-4 py-4">
                    {loadingDetail ? (
                      <p className="text-sm text-slate-600">Loading…</p>
                    ) : detailError ? (
                      <p className="text-sm text-rose-800">{detailError}</p>
                    ) : detail ? (
                      <>
                        <div className="grid gap-2 text-sm text-slate-800 sm:grid-cols-2">
                          <p>
                            <span className="font-semibold text-slate-600">Phone:</span>{" "}
                            {String(detail.phone ?? "")}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-600">Email:</span>{" "}
                            {String(detail.email ?? "")}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-600">DOB:</span>{" "}
                            {String(detail.dateOfBirth ?? "")}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-600">Service / location:</span>{" "}
                            {String(detail.service ?? "")} · {String(detail.location ?? "")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {detail.insuranceCard ? (
                            <>
                              <button
                                type="button"
                                disabled={docBusy !== null}
                                onClick={() => void openDocument(row.id, "insurance", "inline")}
                                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                              >
                                {docBusy === `${row.id}:insurance:inline` ? "Opening…" : "View insurance card"}
                              </button>
                              <button
                                type="button"
                                disabled={docBusy !== null}
                                onClick={() => void openDocument(row.id, "insurance", "download")}
                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50"
                              >
                                {docBusy === `${row.id}:insurance:download` ? "Preparing…" : "Download insurance card"}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500">No insurance card on file.</span>
                          )}
                          {detail.driversLicense ? (
                            <>
                              <button
                                type="button"
                                disabled={docBusy !== null}
                                onClick={() => void openDocument(row.id, "drivers_license", "inline")}
                                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                              >
                                {docBusy === `${row.id}:drivers_license:inline` ? "Opening…" : "View ID"}
                              </button>
                              <button
                                type="button"
                                disabled={docBusy !== null}
                                onClick={() => void openDocument(row.id, "drivers_license", "download")}
                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50"
                              >
                                {docBusy === `${row.id}:drivers_license:download` ? "Preparing…" : "Download ID"}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500">No ID on file.</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Access log (most recent first)
                          </h3>
                          <ul className="mt-2 max-h-56 space-y-1.5 overflow-y-auto text-xs text-slate-700">
                            {accessLog.length === 0 ? (
                              <li className="text-slate-500">No access events recorded yet.</li>
                            ) : (
                              accessLog.map((log) => (
                                <li
                                  key={log.id}
                                  className="rounded border border-slate-200 bg-white px-2 py-1.5 font-mono leading-snug"
                                >
                                  <span className="text-slate-500">{formatWhen(log.at)}</span> —{" "}
                                  {actionLabel(log.action)}
                                  {log.documentKey ? ` (${log.documentKey})` : ""} —{" "}
                                  {log.actorEmail ?? log.actorUid.slice(0, 8) + "…"}
                                  {log.ip ? ` · IP ${log.ip}` : ""}
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
