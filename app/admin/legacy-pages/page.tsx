"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { AdminAuthGate } from "@/app/admin/_components/AdminAuthGate";
import type { LegacyPage } from "@/lib/legacy-pages";

type Row = LegacyPage & { _dirty?: boolean };

export default function LegacyPagesAdminPage() {
  return (
    <AdminAuthGate requireMinRole="manager">
      <LegacyPagesEditor />
    </AdminAuthGate>
  );
}

async function getIdToken(): Promise<string | null> {
  const user = getFirebaseClientAuth().currentUser;
  return user ? user.getIdToken() : null;
}

function LegacyPagesEditor() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [siteFilter, setSiteFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/admin/legacy-pages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { pages?: LegacyPage[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      setRows((data.pages ?? []).map((p) => ({ ...p })));
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Load failed" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback((id: string, changes: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes, _dirty: true } : r)));
  }, []);

  const save = useCallback(
    async (row: Row) => {
      setSavingId(row.id);
      setMessage(null);
      try {
        const token = await getIdToken();
        if (!token) throw new Error("Not signed in");
        const res = await fetch(`/api/admin/legacy-pages/${encodeURIComponent(row.id)}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({
            title: row.title,
            metaTitle: row.metaTitle,
            metaDescription: row.metaDescription,
            heroImage: row.heroImage,
            order: row.order,
            published: row.published,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Save failed");
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, _dirty: false } : r)));
        setMessage({ kind: "ok", text: "Saved — live within about 60 seconds" });
      } catch (e) {
        setMessage({ kind: "err", text: e instanceof Error ? e.message : "Save failed" });
      } finally {
        setSavingId(null);
      }
    },
    [],
  );

  const filtered = useMemo(
    () => (siteFilter === "all" ? rows : rows.filter((r) => r.site === siteFilter)),
    [rows, siteFilter],
  );

  const sites = useMemo(() => Array.from(new Set(rows.map((r) => r.site))).sort(), [rows]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Legacy pages</h1>
          <p className="mt-1 text-sm text-slate-600">
            Verbatim pages migrated from the old sites (<code>legacyPages</code>). Edit titles,
            SEO meta, ordering, and publish state. Body copy stays verbatim from the scrape.
          </p>
        </div>
        <Link href="/admin/super" className="text-sm font-semibold text-[#c0392b] underline">
          ← Back to admin
        </Link>
      </div>

      {message ? (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            message.kind === "ok"
              ? "bg-emerald-50 text-emerald-900"
              : "bg-amber-50 text-amber-950"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="font-semibold text-slate-600">Site:</span>
        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1"
        >
          <option value="all">All ({rows.length})</option>
          {sites.map((s) => (
            <option key={s} value={s}>
              {s} ({rows.filter((r) => r.site === s).length})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1 font-semibold hover:border-slate-400"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Loading…</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={row.route}
                    target="_blank"
                    className="font-mono text-xs text-[#c0392b] underline"
                  >
                    {row.route}
                  </Link>
                  {row.hasCuratedRoute ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      curated route owns this path
                    </span>
                  ) : null}
                </div>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.published}
                    onChange={(e) => patch(row.id, { published: e.target.checked })}
                  />
                  Published
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Title
                  <input
                    value={row.title}
                    onChange={(e) => patch(row.id, { title: e.target.value })}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm font-normal text-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Order
                  <input
                    type="number"
                    value={row.order}
                    onChange={(e) => patch(row.id, { order: Number(e.target.value) })}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm font-normal text-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 sm:col-span-2">
                  Meta title
                  <input
                    value={row.metaTitle}
                    onChange={(e) => patch(row.id, { metaTitle: e.target.value })}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm font-normal text-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 sm:col-span-2">
                  Meta description
                  <textarea
                    value={row.metaDescription}
                    onChange={(e) => patch(row.id, { metaDescription: e.target.value })}
                    rows={2}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm font-normal text-slate-900"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {row.blocks.length} blocks · {row.images.length} images
                </span>
                <button
                  type="button"
                  disabled={!row._dirty || savingId === row.id}
                  onClick={() => void save(row)}
                  className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {savingId === row.id ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
