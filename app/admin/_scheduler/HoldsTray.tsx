"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";

export type HoldRow = {
  id: string;
  locationId: "paris" | "sulphur_springs";
  scope: "all" | "massage" | "chiropractic";
  startAtMs: number;
  endAtMs: number;
  durationMin: number;
  note: string;
  createdByEmail: string | null;
};

type Props = {
  holds: HoldRow[];
  getIdToken: () => Promise<string | null>;
  onDeleted: () => void;
};

function scopeLabel(s: HoldRow["scope"]): string {
  if (s === "all") return "All services";
  if (s === "massage") return "Massage only";
  return "Chiropractic only";
}

function locationLabel(id: HoldRow["locationId"]): string {
  return id === "paris" ? "Paris" : "Sulphur Springs";
}

function formatRange(startMs: number, endMs: number): string {
  const start = DateTime.fromMillis(startMs).setZone(TIME_ZONE);
  const end = DateTime.fromMillis(endMs).setZone(TIME_ZONE);
  if (!start.isValid || !end.isValid) return "";
  return `${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`;
}

export function HoldsTray({ holds, getIdToken, onDeleted }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (holds.length === 0) return null;

  async function deleteHold(id: string, label: string) {
    setError(null);
    if (!window.confirm(`Remove this hold (${label})? The blocked slots become bookable again.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const token = await getIdToken();
      if (!token) {
        setError("Not signed in.");
        return;
      }
      const res = await fetch(`/api/admin/holds/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to remove hold.");
        return;
      }
      onDeleted();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-semibold text-rose-950">Blocked time on this day</h2>
          <p className="text-xs text-rose-900/80">
            {holds.length} hold{holds.length === 1 ? "" : "s"} — these times are hidden from the
            public booking page. Delete to make the slots bookable again.
          </p>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-rose-900 ring-1 ring-rose-300">
          {holds.length}
        </span>
      </header>
      {error ? (
        <p className="mt-2 rounded-md border border-rose-300 bg-white px-3 py-2 text-xs text-rose-900">
          {error}
        </p>
      ) : null}
      <ul className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {holds.map((h) => {
          const range = formatRange(h.startAtMs, h.endAtMs);
          const label = `${locationLabel(h.locationId)} · ${scopeLabel(h.scope).toLowerCase()} · ${range}`;
          return (
            <li key={h.id}>
              <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-rose-200">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold text-slate-900">{range}</span>
                  <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-900">
                    {scopeLabel(h.scope)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-700">
                  {locationLabel(h.locationId)} · {h.durationMin} min
                </div>
                {h.note ? (
                  <p className="mt-1 text-xs text-slate-600">&ldquo;{h.note}&rdquo;</p>
                ) : null}
                {h.createdByEmail ? (
                  <p className="mt-0.5 text-[11px] text-slate-500">Added by {h.createdByEmail}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => deleteHold(h.id, label)}
                  disabled={deletingId === h.id}
                  className="mt-2 rounded-full border border-rose-300 bg-white px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  {deletingId === h.id ? "Removing…" : "Remove hold"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
