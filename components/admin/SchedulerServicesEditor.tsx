"use client";

import { useCallback, useEffect, useState } from "react";
import { ProviderColorSchemeEditor } from "@/components/admin/ProviderColorSchemeEditor";
import {
  formatServiceDuration,
  formatServicePrice,
  type SchedulerServiceRow,
  type SchedulerServiceVisibility,
} from "@/lib/scheduler-service-types";

type Props = {
  getIdToken: () => Promise<string | null>;
};

export function SchedulerServicesEditor({ getIdToken }: Props) {
  const [services, setServices] = useState<SchedulerServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const token = await getIdToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/admin/scheduler-services", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { services?: SchedulerServiceRow[]; error?: string };
    if (res.ok) setServices(data.services ?? []);
    else setMessage(data.error ?? "Could not load services.");
    setLoading(false);
  }, [getIdToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchService(id: string, patch: Record<string, unknown>) {
    setSavingId(id);
    setMessage(null);
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch(`/api/admin/scheduler-services/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(data.error ?? "Save failed.");
    } else {
      await load();
    }
    setSavingId(null);
  }

  async function createService() {
    const name = window.prompt("New service name");
    if (!name?.trim()) return;
    setCreating(true);
    setMessage(null);
    const token = await getIdToken();
    if (!token) {
      setCreating(false);
      return;
    }
    const res = await fetch("/api/admin/scheduler-services", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        durationMinutes: 60,
        priceCents: 0,
        visibility: "both",
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(data.error ?? "Could not add service.");
    } else {
      await load();
    }
    setCreating(false);
  }

  async function moveService(id: string, dir: -1 | 1) {
    const idx = services.findIndex((s) => s.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= services.length) return;
    const reordered = [...services];
    const [row] = reordered.splice(idx, 1);
    reordered.splice(next, 0, row);
    setServices(reordered);
    const token = await getIdToken();
    if (!token) return;
    await fetch("/api/admin/scheduler-services", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ orderedIds: reordered.map((s) => s.id) }),
    });
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading service types…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Service types drive duration, price, buffer times, and calendar colors. A default clinic
        service list is created automatically the first time this screen is opened (editable here).
      </p>
      {message ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {message}
        </p>
      ) : null}
      <div>
        <button
          type="button"
          disabled={creating}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() => void createService()}
        >
          {creating ? "Adding…" : "Add service"}
        </button>
      </div>
      <ul className="space-y-4">
        {services.map((s, idx) => (
          <li
            key={s.id}
            className={`rounded-xl border border-slate-200 bg-slate-50/80 p-4 ${!s.active ? "opacity-60" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  className="w-full max-w-md rounded border border-slate-300 px-2 py-1 text-sm font-semibold"
                  value={s.name}
                  onChange={(e) =>
                    setServices((prev) =>
                      prev.map((row) => (row.id === s.id ? { ...row, name: e.target.value } : row)),
                    )
                  }
                  onBlur={() => patchService(s.id, { name: s.name })}
                />
                <div className="flex flex-wrap gap-3 text-sm">
                  <label className="flex items-center gap-1">
                    Price $
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-20 rounded border border-slate-300 px-2 py-0.5"
                      value={(s.priceCents / 100).toFixed(2)}
                      onChange={(e) => {
                        const dollars = Number(e.target.value);
                        const priceCents = Number.isFinite(dollars)
                          ? Math.round(dollars * 100)
                          : 0;
                        setServices((prev) =>
                          prev.map((row) =>
                            row.id === s.id ? { ...row, priceCents } : row,
                          ),
                        );
                      }}
                      onBlur={() => patchService(s.id, { priceCents: s.priceCents })}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    Duration (min)
                    <input
                      type="number"
                      min={15}
                      step={15}
                      className="w-16 rounded border border-slate-300 px-2 py-0.5"
                      value={s.durationMinutes}
                      onChange={(e) => {
                        const durationMinutes = Number(e.target.value) || 30;
                        setServices((prev) =>
                          prev.map((row) =>
                            row.id === s.id ? { ...row, durationMinutes } : row,
                          ),
                        );
                      }}
                      onBlur={() => patchService(s.id, { durationMinutes: s.durationMinutes })}
                    />
                    <span className="text-slate-500">({formatServiceDuration(s.durationMinutes)})</span>
                  </label>
                  <label className="flex items-center gap-1">
                    Buffer before
                    <input
                      type="number"
                      min={0}
                      className="w-14 rounded border border-slate-300 px-2 py-0.5"
                      value={s.bufferBeforeMinutes}
                      onChange={(e) => {
                        const bufferBeforeMinutes = Number(e.target.value) || 0;
                        setServices((prev) =>
                          prev.map((row) =>
                            row.id === s.id ? { ...row, bufferBeforeMinutes } : row,
                          ),
                        );
                      }}
                      onBlur={() =>
                        patchService(s.id, { bufferBeforeMinutes: s.bufferBeforeMinutes })
                      }
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    Buffer after
                    <input
                      type="number"
                      min={0}
                      className="w-14 rounded border border-slate-300 px-2 py-0.5"
                      value={s.bufferAfterMinutes}
                      onChange={(e) => {
                        const bufferAfterMinutes = Number(e.target.value) || 0;
                        setServices((prev) =>
                          prev.map((row) =>
                            row.id === s.id ? { ...row, bufferAfterMinutes } : row,
                          ),
                        );
                      }}
                      onBlur={() =>
                        patchService(s.id, { bufferAfterMinutes: s.bufferAfterMinutes })
                      }
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    Visibility
                    <select
                      className="rounded border border-slate-300 bg-white px-2 py-0.5"
                      value={s.visibility}
                      onChange={(e) => {
                        const visibility = e.target.value as SchedulerServiceVisibility;
                        setServices((prev) =>
                          prev.map((row) => (row.id === s.id ? { ...row, visibility } : row)),
                        );
                        void patchService(s.id, { visibility });
                      }}
                    >
                      <option value="both">Both calendars</option>
                      <option value="admin_only">Admin only</option>
                      <option value="customer_only">Customer only</option>
                    </select>
                  </label>
                </div>
                <p className="text-xs text-slate-500">
                  {formatServicePrice(s.priceCents)} · {formatServiceDuration(s.durationMinutes)}
                  {savingId === s.id ? " · Saving…" : ""}
                </p>
                <ProviderColorSchemeEditor
                  displayName={s.name}
                  textColor={s.textColor}
                  bgColor={s.bgColor}
                  onChange={(patch) => {
                    setServices((prev) =>
                      prev.map((row) =>
                        row.id === s.id
                          ? {
                              ...row,
                              textColor: patch.textColor ?? row.textColor,
                              bgColor: patch.bgColor ?? row.bgColor,
                            }
                          : row,
                      ),
                    );
                    void patchService(s.id, patch);
                  }}
                />
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  className="rounded border border-slate-300 px-2 py-0.5 text-xs disabled:opacity-40"
                  onClick={() => moveService(s.id, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === services.length - 1}
                  className="rounded border border-slate-300 px-2 py-0.5 text-xs disabled:opacity-40"
                  onClick={() => moveService(s.id, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600"
                  onClick={() => patchService(s.id, { active: !s.active })}
                >
                  {s.active ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
