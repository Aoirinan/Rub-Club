"use client";

import { useCallback, useEffect, useState } from "react";
import type { PageLayoutId } from "@/lib/page-layout";

type BlockDef = { id: string; label: string };
type PageMeta = { id: PageLayoutId; label: string; path: string; blocks: BlockDef[] };

type Props = {
  getIdToken: () => Promise<string | null>;
};

export function PageLayoutEditor({ getIdToken }: Props) {
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [pageId, setPageId] = useState<PageLayoutId>("massage");
  const [order, setOrder] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const loadPages = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/admin/page-layout", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { pages?: PageMeta[] };
    if (res.ok && data.pages?.length) {
      setPages(data.pages);
      if (!data.pages.some((p) => p.id === pageId)) {
        setPageId(data.pages[0]!.id);
      }
    }
  }, [getIdToken, pageId]);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const token = await getIdToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/admin/page-layout?page=${encodeURIComponent(pageId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as {
      blockOrder?: string[];
      blocks?: BlockDef[];
      error?: string;
    };
    if (!res.ok) {
      setMessage(data.error ?? "Could not load layout.");
      setLoading(false);
      return;
    }
    const blockOrder = data.blockOrder ?? [];
    setOrder(blockOrder);
    const map: Record<string, string> = {};
    for (const b of data.blocks ?? []) {
      map[b.id] = b.label;
    }
    setLabels(map);
    setLoading(false);
  }, [getIdToken, pageId]);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function save() {
    setSaving(true);
    setMessage(null);
    const token = await getIdToken();
    if (!token) {
      setSaving(false);
      return;
    }
    const res = await fetch("/api/admin/page-layout", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ page: pageId, blockOrder: order }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; blockOrder?: string[] };
    if (!res.ok) {
      setMessage(data.error ?? "Save failed.");
    } else {
      setMessage("Saved â€” live within about a minute.");
      if (data.blockOrder) setOrder(data.blockOrder);
    }
    setSaving(false);
  }

  function moveBlock(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row!);
      return next;
    });
  }

  const activePage = pages.find((p) => p.id === pageId);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Page layout</h2>
        <p className="mt-2 text-sm text-slate-600">
          Drag sections to change their order on the live page. Hero, breadcrumbs, and the site
          header stay fixed â€” only the main content blocks below them move.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Page</span>
            <select
              className="mt-1 block min-w-[200px] rounded-lg border border-slate-300 px-3 py-2"
              value={pageId}
              onChange={(e) => setPageId(e.target.value as PageLayoutId)}
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {activePage ? (
            <a
              href={activePage.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#c0392b] underline"
            >
              Preview live page â†—
            </a>
          ) : null}
        </div>
      </div>

      {message ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-600">Loading sectionsâ€¦</p>
      ) : (
        <ul className="space-y-2">
          {order.map((id, idx) => (
            <li
              key={id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null) moveBlock(dragIdx, idx);
                setDragIdx(null);
              }}
              onDragEnd={() => setDragIdx(null)}
              className={`flex cursor-grab items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm active:cursor-grabbing ${
                dragIdx === idx ? "ring-2 ring-[#c0392b]" : ""
              }`}
            >
              <span className="text-slate-400" aria-hidden>
                â‹®â‹®
              </span>
              <span className="flex-1 text-sm font-semibold text-slate-900">
                {labels[id] ?? id}
              </span>
              <span className="text-xs text-slate-500">#{idx + 1}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={saving || loading}
        onClick={() => void save()}
        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Savingâ€¦" : "Save layout"}
      </button>
    </div>
  );
}
