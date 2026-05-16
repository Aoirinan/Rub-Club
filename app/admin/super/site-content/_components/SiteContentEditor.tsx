"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import type { ContentFieldType, ContentPageKey } from "@/lib/cms";

type FieldRow = {
  id: string;
  pageLabel: ContentPageKey;
  sectionLabel: string;
  fieldLabel: string;
  type: ContentFieldType;
  value: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

type ChangelogEntry = {
  id: string;
  fieldId: string;
  pageLabel: string;
  fieldLabel: string;
  changedBy: string;
  changedAt: string | null;
};

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
};

const PAGE_NAV: { key: ContentPageKey | "FAQ Items"; label: string }[] = [
  { key: "Home", label: "Home" },
  { key: "Chiropractic", label: "Chiropractic" },
  { key: "Massage", label: "Massage" },
  { key: "Sulphur Springs", label: "Sulphur Springs" },
  { key: "About", label: "About" },
  { key: "FAQ", label: "FAQ" },
  { key: "Contact", label: "Contact" },
  { key: "Footer", label: "Footer" },
  { key: "Navigation", label: "Navigation" },
  { key: "Doctors", label: "Doctors" },
  { key: "FAQ Items", label: "FAQ items" },
];

const BADGE_CLASS: Record<string, string> = {
  Home: "bg-blue-100 text-blue-900",
  Chiropractic: "bg-teal-100 text-teal-900",
  Massage: "bg-purple-100 text-purple-900",
  "Sulphur Springs": "bg-orange-100 text-orange-900",
  About: "bg-green-100 text-green-900",
  FAQ: "bg-yellow-100 text-yellow-900",
  Contact: "bg-slate-200 text-slate-800",
  Footer: "bg-slate-300 text-slate-900",
  Navigation: "bg-slate-400 text-white",
  Doctors: "bg-teal-50 text-teal-950",
};

function truncate(s: string, n = 60): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function RichTextArea({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const wrap = (before: string, after: string) => {
    const el = document.getElementById("cms-richtext") as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = value.slice(start, end);
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <button type="button" className="rounded border px-2 py-0.5 text-xs font-semibold" onClick={() => wrap("**", "**")}>
          Bold
        </button>
        <button type="button" className="rounded border px-2 py-0.5 text-xs font-semibold" onClick={() => wrap("_", "_")}>
          Italic
        </button>
        <button type="button" className="rounded border px-2 py-0.5 text-xs font-semibold" onClick={() => wrap("\n- ", "")}>
          Bullet
        </button>
      </div>
      <textarea
        id="cms-richtext"
        className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SiteContentEditor() {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [selectedPage, setSelectedPage] = useState<ContentPageKey | "FAQ Items">("Home");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [faqForm, setFaqForm] = useState<{
    mode: "add" | "edit";
    id?: string;
    question: string;
    answer: string;
    category: string;
    active: boolean;
  } | null>(null);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  const getToken = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user) throw new Error("Not signed in");
    return user.getIdToken();
  }, [auth]);

  const showToast = (kind: "ok" | "err", text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 5000);
  };

  const loadAll = useCallback(async () => {
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };
    const [contentRes, logRes, faqRes] = await Promise.all([
      fetch("/api/admin/site-content", { headers }),
      fetch("/api/admin/site-content/changelog", { headers }),
      fetch("/api/admin/site-faqs", { headers }),
    ]);
    const contentData = (await contentRes.json()) as { fields?: FieldRow[] };
    const logData = (await logRes.json()) as { entries?: ChangelogEntry[] };
    const faqData = (await faqRes.json()) as { faqs?: FaqRow[] };
    if (contentRes.ok && contentData.fields) setFields(contentData.fields);
    if (logRes.ok && logData.entries) setChangelog(logData.entries);
    if (faqRes.ok && faqData.faqs) setFaqs(faqData.faqs);
  }, [getToken]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, () => {
      void loadAll();
    });
    return () => unsub();
  }, [auth, loadAll]);

  const filteredFields = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fields.filter((f) => {
      if (selectedPage !== "FAQ Items" && f.pageLabel !== selectedPage) return false;
      if (selectedPage === "FAQ Items") return false;
      if (!q) return true;
      return (
        f.pageLabel.toLowerCase().includes(q) ||
        f.sectionLabel.toLowerCase().includes(q) ||
        f.fieldLabel.toLowerCase().includes(q) ||
        f.value.toLowerCase().includes(q)
      );
    });
  }, [fields, search, selectedPage]);

  const globalSearchFields = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return fields.filter(
      (f) =>
        f.pageLabel.toLowerCase().includes(q) ||
        f.sectionLabel.toLowerCase().includes(q) ||
        f.fieldLabel.toLowerCase().includes(q) ||
        f.value.toLowerCase().includes(q),
    );
  }, [fields, search]);

  const displayFields = search.trim() && selectedPage !== "FAQ Items" ? globalSearchFields : filteredFields;

  async function saveField(id: string, value: string, file?: File) {
    setBusy(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(`/api/admin/site-content/${encodeURIComponent(id)}/upload`, {
          method: "POST",
          headers,
          body: fd,
        });
        const upData = (await up.json()) as { error?: string };
        if (!up.ok) throw new Error(upData.error ?? "Upload failed");
      } else {
        const res = await fetch(`/api/admin/site-content/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({ value }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Save failed");
      }
      showToast("ok", "Saved — live on site within 60 seconds");
      setEditingId(null);
      await loadAll();
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function resetField(id: string, label: string) {
    if (!window.confirm(`Reset "${label}" to its original default? Cannot be undone.`)) return;
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/site-content/${encodeURIComponent(id)}/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      showToast("ok", "Reset to default");
      setEditingId(null);
      await loadAll();
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveFaq() {
    if (!faqForm) return;
    setBusy(true);
    try {
      const token = await getToken();
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
      showToast("ok", "FAQ saved");
      setFaqForm(null);
      await loadAll();
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : "FAQ save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteFaq(id: string) {
    if (!window.confirm("Delete this FAQ?")) return;
    const token = await getToken();
    await fetch(`/api/admin/site-faqs/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadAll();
  }

  async function moveFaq(index: number, dir: -1 | 1) {
    const next = [...faqs].sort((a, b) => a.order - b.order);
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    const token = await getToken();
    await fetch("/api/admin/site-faqs/reorder", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ orderedIds: next.map((f) => f.id) }),
    });
    await loadAll();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Site content</h1>
        <p className="mt-1 text-sm text-slate-600">
          Edit public page copy, images, and FAQs. Changes appear on the live site within about 60 seconds.
        </p>
      </div>

      {toast ? (
        <p
          className={`mb-4 rounded-lg px-4 py-2 text-sm font-medium ${
            toast.kind === "ok" ? "bg-green-100 text-green-900" : "bg-rose-100 text-rose-900"
          }`}
        >
          {toast.text}
        </p>
      ) : null}

      <input
        type="search"
        placeholder="Search fields across all pages…"
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="lg:w-48 shrink-0 space-y-1">
          {PAGE_NAV.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setSelectedPage(p.key);
                setEditingId(null);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                selectedPage === p.key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-3">
          {selectedPage === "FAQ Items" ? (
            <>
              <div className="flex justify-between">
                <h2 className="text-lg font-semibold text-slate-900">FAQ items</h2>
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
              {faqForm ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
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
                      className="rounded-full bg-[#0f5f5c] px-4 py-2 text-xs font-bold text-white"
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
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={f.active}
                          onChange={async () => {
                            const token = await getToken();
                            await fetch(`/api/admin/site-faqs/${f.id}`, {
                              method: "PATCH",
                              headers: {
                                Authorization: `Bearer ${token}`,
                                "content-type": "application/json",
                              },
                              body: JSON.stringify({ active: !f.active }),
                            });
                            await loadAll();
                          }}
                        />
                        Active
                      </label>
                      <button type="button" className="text-xs font-semibold underline" onClick={() => moveFaq(i, -1)}>
                        ↑
                      </button>
                      <button type="button" className="text-xs font-semibold underline" onClick={() => moveFaq(i, 1)}>
                        ↓
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#0f5f5c] underline"
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
            </>
          ) : (
            displayFields.map((field) => (
              <div key={field.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${BADGE_CLASS[field.pageLabel] ?? "bg-slate-100"}`}
                  >
                    {field.pageLabel}
                  </span>
                  <span className="text-xs text-slate-500">{field.sectionLabel}</span>
                  <span className="text-sm font-semibold text-slate-900">{field.fieldLabel}</span>
                  <span className="ml-auto max-w-[40%] truncate text-xs text-slate-500">{truncate(field.value)}</span>
                  <button
                    type="button"
                    className="text-xs font-bold text-[#0f5f5c] underline"
                    onClick={() => {
                      setEditingId(field.id);
                      setDraft(field.value);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold text-slate-600 underline"
                    onClick={() => void resetField(field.id, field.fieldLabel)}
                  >
                    Reset
                  </button>
                </div>
                {editingId === field.id ? (
                  <div className="space-y-3 px-4 py-4">
                    {field.type === "text" || field.type === "phone" ? (
                      <input
                        type={field.type === "phone" ? "tel" : "text"}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                      />
                    ) : null}
                    {field.type === "url" ? (
                      <div className="flex gap-2">
                        <input
                          type="url"
                          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                        />
                        {draft.startsWith("http") ? (
                          <a
                            href={draft}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded border px-3 py-2 text-xs font-bold"
                          >
                            Open
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                    {field.type === "richtext" ? (
                      <RichTextArea value={draft} onChange={setDraft} />
                    ) : null}
                    {field.type === "image" || field.type === "video" ? (
                      <div className="space-y-2">
                        {field.type === "image" && field.value ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={field.value} alt="" className="max-h-24 rounded border object-contain" />
                        ) : null}
                        {field.value && field.type === "video" ? (
                          <p className="text-xs text-slate-600 break-all">{field.value}</p>
                        ) : null}
                        <input
                          type="file"
                          accept={field.type === "image" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/quicktime,video/webm"}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void saveField(field.id, field.value, file);
                          }}
                        />
                      </div>
                    ) : null}
                    {field.type !== "image" && field.type !== "video" ? (
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-full bg-[#0f5f5c] px-5 py-2 text-sm font-bold text-white"
                        onClick={() => void saveField(field.id, draft)}
                      >
                        Save
                      </button>
                    ) : null}
                    <button type="button" className="ml-2 text-sm underline" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent changes</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-slate-500">
              <th className="py-2 pr-2">Field</th>
              <th className="py-2 pr-2">Page</th>
              <th className="py-2 pr-2">Changed by</th>
              <th className="py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {changelog.map((e) => (
              <tr key={e.id} className="border-b border-slate-100">
                <td className="py-2 pr-2 font-medium">{e.fieldLabel}</td>
                <td className="py-2 pr-2">{e.pageLabel}</td>
                <td className="py-2 pr-2 text-slate-600">{e.changedBy || "—"}</td>
                <td className="py-2 text-slate-600">{timeAgo(e.changedAt)}</td>
              </tr>
            ))}
            {changelog.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-slate-500">
                  No edits logged yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
