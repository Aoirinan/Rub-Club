"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  PracticeLocationId,
  PracticeTestimonial,
} from "@/lib/practice-pages-shared";

type Props = {
  location: PracticeLocationId;
  getIdToken: () => Promise<string | null>;
};

type FormState = {
  mode: "add" | "edit";
  id?: string;
  name: string;
  context: string;
  quote: string;
  published: boolean;
};

/** Full CRUD (add/edit/delete/reorder/publish) for a location's patient reviews. */
export function PracticeTestimonialsPanel({ location, getIdToken }: Props) {
  const [rows, setRows] = useState<PracticeTestimonial[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const base = `/api/admin/practice-pages/${location}/testimonials`;

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch(base, { headers: { Authorization: `Bearer ${token}` } });
    const data = (await res.json()) as { testimonials?: PracticeTestimonial[] };
    if (res.ok && data.testimonials) setRows(data.testimonials);
  }, [base, getIdToken]);

  useEffect(() => {
    setRows([]);
    setForm(null);
    setMessage(null);
    void load();
  }, [load]);

  async function save() {
    if (!form) return;
    setBusy(true);
    setMessage(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not signed in");
      const headers = {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      };
      const body = {
        name: form.name,
        context: form.context,
        quote: form.quote,
        published: form.published,
      };
      const res =
        form.mode === "add"
          ? await fetch(base, { method: "POST", headers, body: JSON.stringify(body) })
          : await fetch(`${base}/${encodeURIComponent(form.id!)}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify(body),
            });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMessage("Review saved");
      setForm(null);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(row: PracticeTestimonial) {
    const token = await getIdToken();
    if (!token) return;
    await fetch(`${base}/${encodeURIComponent(row.id)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ published: !row.published }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this review?")) return;
    const token = await getIdToken();
    if (!token) return;
    await fetch(`${base}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...rows];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    const token = await getIdToken();
    if (!token) return;
    await fetch(`${base}/reorder`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((r) => r.id) }),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-600">
          Only <strong>published</strong> reviews show on the page. Unpublished placeholders are
          hidden until you replace and publish them.
        </p>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white"
          onClick={() => setForm({ mode: "add", name: "", context: "", quote: "", published: false })}
        >
          Add review
        </button>
      </div>
      {message ? (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-900">{message}</p>
      ) : null}
      {form ? (
        <div className="space-y-2 rounded-xl border bg-white p-4">
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Patient name (e.g. Jane D.)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Context (optional, e.g. Auto injury recovery · Google review)"
            value={form.context}
            onChange={(e) => setForm({ ...form, context: e.target.value })}
          />
          <textarea
            className="min-h-[80px] w-full rounded border px-3 py-2 text-sm"
            placeholder="Quote"
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published on site
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !form.quote.trim()}
              className="rounded-full bg-[#0f5f5c] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              onClick={() => void save()}
            >
              Save review
            </button>
            <button type="button" className="text-sm underline" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {rows.map((r, i) => (
          <li key={r.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
            <span className="text-slate-400">#{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="font-medium text-slate-900">{r.name || "(no name)"}</span>
              <span className="ml-2 text-slate-500">
                {r.quote.length > 80 ? `${r.quote.slice(0, 80)}…` : r.quote}
              </span>
            </span>
            <button
              type="button"
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                r.published ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-600"
              }`}
              onClick={() => void togglePublished(r)}
              title="Toggle published"
            >
              {r.published ? "Published" : "Hidden"}
            </button>
            <button type="button" className="text-xs font-semibold underline" onClick={() => void move(i, -1)}>
              ↑
            </button>
            <button type="button" className="text-xs font-semibold underline" onClick={() => void move(i, 1)}>
              ↓
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-[#0f5f5c] underline"
              onClick={() =>
                setForm({
                  mode: "edit",
                  id: r.id,
                  name: r.name,
                  context: r.context,
                  quote: r.quote,
                  published: r.published,
                })
              }
            >
              Edit
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-rose-700 underline"
              onClick={() => void remove(r.id)}
            >
              Delete
            </button>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-3 text-sm text-slate-600">No reviews yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
