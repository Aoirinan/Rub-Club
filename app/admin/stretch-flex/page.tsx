"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { AdminAuthGate } from "@/app/admin/_components/AdminAuthGate";
import type { StretchFlexExercise, StretchFlexImage } from "@/lib/stretch-flex";

export default function StretchFlexAdminPage() {
  return (
    <AdminAuthGate requireMinRole="manager">
      <StretchFlexEditor />
    </AdminAuthGate>
  );
}

async function getIdToken(): Promise<string | null> {
  const user = getFirebaseClientAuth().currentUser;
  return user ? user.getIdToken() : null;
}

type Row = StretchFlexExercise & { _dirty?: boolean };

function StretchFlexEditor() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/admin/stretch-flex", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { exercises?: StretchFlexExercise[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      setRows((data.exercises ?? []).map((e) => ({ ...e })));
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

  const save = useCallback(async (row: Row) => {
    setBusyId(row.id);
    setMessage(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not signed in");
      const res = await fetch(`/api/admin/stretch-flex/${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          name: row.name,
          instructions: row.instructions,
          order: row.order,
          images: row.images,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, _dirty: false } : r)));
      setMessage({ kind: "ok", text: "Saved — live within about 60 seconds" });
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setBusyId(null);
    }
  }, []);

  const upload = useCallback(
    async (row: Row, file: File) => {
      setBusyId(row.id);
      setMessage(null);
      try {
        const token = await getIdToken();
        if (!token) throw new Error("Not signed in");
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/admin/stretch-flex/${encodeURIComponent(row.id)}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
        const nextImages: StretchFlexImage[] = [...row.images, { url: data.url, alt: "", caption: "" }];
        patch(row.id, { images: nextImages });
        setMessage({ kind: "ok", text: "Uploaded — remember to Save" });
      } catch (e) {
        setMessage({ kind: "err", text: e instanceof Error ? e.message : "Upload failed" });
      } finally {
        setBusyId(null);
      }
    },
    [patch],
  );

  const editImage = useCallback(
    (row: Row, idx: number, changes: Partial<StretchFlexImage>) => {
      const images = row.images.map((img, i) => (i === idx ? { ...img, ...changes } : img));
      patch(row.id, { images });
    },
    [patch],
  );

  const removeImage = useCallback(
    (row: Row, idx: number) => {
      patch(row.id, { images: row.images.filter((_, i) => i !== idx) });
    },
    [patch],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Stretch &amp; Flex Rehab photos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add a photo (or small gallery) with caption and alt text to each exercise. Empty
            galleries are fine — they simply do not render until photos are added.
          </p>
        </div>
        <Link href="/admin/super" className="text-sm font-semibold text-[#c0392b] underline">
          ← Back to admin
        </Link>
      </div>

      {message ? (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            message.kind === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-600">Loading…</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Exercise name
                  <input
                    value={row.name}
                    onChange={(e) => patch(row.id, { name: e.target.value })}
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
              </div>
              <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Instructions (verbatim)
                <textarea
                  value={row.instructions}
                  onChange={(e) => patch(row.id, { instructions: e.target.value })}
                  rows={3}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm font-normal text-slate-900"
                />
              </label>

              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-600">
                  Photos {row.images.length === 0 ? "(none yet — Sean to shoot)" : `(${row.images.length})`}
                </p>
                <div className="mt-2 space-y-2">
                  {row.images.map((img, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt} className="h-12 w-16 rounded object-cover" />
                      <input
                        value={img.alt}
                        onChange={(e) => editImage(row, i, { alt: e.target.value })}
                        placeholder="Alt text"
                        className="min-w-[8rem] flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                      <input
                        value={img.caption}
                        onChange={(e) => editImage(row, i, { caption: e.target.value })}
                        placeholder="Caption"
                        className="min-w-[8rem] flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(row, i)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <label className="mt-2 inline-block cursor-pointer text-sm font-semibold text-[#c0392b]">
                  + Upload photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void upload(row, f);
                    }}
                  />
                </label>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={!row._dirty || busyId === row.id}
                  onClick={() => void save(row)}
                  className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {busyId === row.id ? "Working…" : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
