"use client";

import { useCallback, useEffect, useState } from "react";

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
};

type Props = {
  getIdToken: () => Promise<string | null>;
};

export function FaqItemsPanel({ getIdToken }: Props) {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState<{
    mode: "add" | "edit";
    id?: string;
    question: string;
    answer: string;
    category: string;
    active: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/admin/site-faqs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { faqs?: FaqRow[] };
    if (res.ok && data.faqs) setFaqs(data.faqs);
  }, [getIdToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveFaq() {
    if (!faqForm) return;
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
        question: faqForm.question,
        answer: faqForm.answer,
        category: faqForm.category,
        active: faqForm.active,
      };
      const res =
        faqForm.mode === "add"
          ? await fetch("/api/admin/site-faqs", { method: "POST", headers, body: JSON.stringify(body) })
          : await fetch(`/api/admin/site-faqs/${encodeURIComponent(faqForm.id!)}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify(body),
            });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "FAQ save failed");
      setMessage("FAQ saved");
      setFaqForm(null);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteFaq(id: string) {
    if (!window.confirm("Delete this FAQ?")) return;
    const token = await getIdToken();
    if (!token) return;
    await fetch(`/api/admin/site-faqs/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
  }

  async function moveFaq(index: number, dir: -1 | 1) {
    const next = [...faqs].sort((a, b) => a.order - b.order);
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    const token = await getIdToken();
    if (!token) return;
    await fetch("/api/admin/site-faqs/reorder", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ orderedIds: next.map((f) => f.id) }),
    });
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">FAQ items</h2>
          <p className="mt-1 text-xs text-slate-600">
            Category <strong>general</strong> shows on /faq. Category <strong>sulphur-springs</strong> shows on
            /sulphur-springs/q-and-a.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white"
          onClick={() =>
            setFaqForm({
              mode: "add",
              question: "",
              answer: "",
              category: "general",
              active: true,
            })
          }
        >
          Add FAQ
        </button>
      </div>
      {message ? (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-900">{message}</p>
      ) : null}
      {faqForm ? (
        <div className="space-y-2 rounded-xl border bg-white p-4">
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Question"
            value={faqForm.question}
            onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
          />
          <textarea
            className="min-h-[80px] w-full rounded border px-3 py-2 text-sm"
            placeholder="Answer"
            value={faqForm.answer}
            onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
          />
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Category"
            value={faqForm.category}
            onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={faqForm.active}
              onChange={(e) => setFaqForm({ ...faqForm, active: e.target.checked })}
            />
            Active on site
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              className="rounded-full bg-[#015949] px-4 py-2 text-xs font-bold text-white"
              onClick={() => void saveFaq()}
            >
              Save FAQ
            </button>
            <button type="button" className="text-sm underline" onClick={() => setFaqForm(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {[...faqs]
          .sort((a, b) => a.order - b.order)
          .map((f, i) => (
            <li key={f.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
              <span className="text-slate-400">#{i + 1}</span>
              <span className="min-w-0 flex-1 font-medium text-slate-900">{f.question}</span>
              <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-900">{f.category}</span>
              <button type="button" className="text-xs font-semibold underline" onClick={() => moveFaq(i, -1)}>
                â†‘
              </button>
              <button type="button" className="text-xs font-semibold underline" onClick={() => moveFaq(i, 1)}>
                â†“
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-[#015949] underline"
                onClick={() =>
                  setFaqForm({
                    mode: "edit",
                    id: f.id,
                    question: f.question,
                    answer: f.answer,
                    category: f.category,
                    active: f.active,
                  })
                }
              >
                Edit
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-rose-700 underline"
                onClick={() => void deleteFaq(f.id)}
              >
                Delete
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}
