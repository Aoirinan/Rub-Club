"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, type Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { staffRoleLabel, type StaffRole } from "@/lib/staff-roles";

type Submission = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  topic?: string;
  message: string;
  status: "new" | "read" | "archived";
  officeEmailSent: boolean;
  autoReplySent: boolean;
  createdAt: string | null;
};

type DeliveryStatus = {
  sendgridConfigured: boolean;
  officeNotificationConfigured: boolean;
};

type Me = {
  role?: StaffRole | null;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "â€”";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function ContactInbox() {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [filter, setFilter] = useState<"new" | "read" | "archived" | "all">("new");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [delivery, setDelivery] = useState<DeliveryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setMe(null);
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` } });
      const data = (await res.json()) as Me & { authenticated?: boolean };
      setMe(data.authenticated ? data : null);
    });
    return () => unsub();
  }, [auth]);

  const load = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/admin/contact-submissions?status=${encodeURIComponent(filter)}&limit=80`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = (await res.json()) as {
        error?: string;
        submissions?: Submission[];
        newCount?: number;
        delivery?: DeliveryStatus;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not load messages");
      setSubmissions(data.submissions ?? []);
      setNewCount(data.newCount ?? 0);
      setDelivery(data.delivery ?? null);
      if (data.submissions?.length && !data.submissions.some((s) => s.id === selectedId)) {
        setSelectedId(data.submissions[0]!.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [auth, filter, selectedId]);

  useEffect(() => {
    if (me?.role) void load();
  }, [me?.role, load]);

  async function setStatus(id: string, status: Submission["status"]) {
    const user = auth?.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/admin/contact-submissions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    await load();
  }

  const selected = submissions.find((s) => s.id === selectedId) ?? submissions[0] ?? null;

  if (!me?.role) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-600">
        <p>Sign in on the scheduler page first.</p>
        <Link href="/admin/login" className="mt-4 inline-block font-semibold text-[#c0392b] underline">
          Staff sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Contact form inbox</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              All messages from the public contact form appear here. Front desk should check this page â€” email is
              optional backup only.
            </p>
            <p className="text-xs text-slate-500">
              Signed in as {auth?.currentUser?.email ?? "â€¦"} ({staffRoleLabel(me.role)})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              â† Scheduler
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={async () => {
                if (auth) await signOut(auth);
                window.location.href = "/admin/login";
              }}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        {delivery && !delivery.sendgridConfigured ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Visitor auto-reply email needs attention</p>
            <p className="mt-1">
              Messages are always saved here for staff. SendGrid is not fully configured (API key + verified FROM
              address), so visitors may not receive a confirmation email. A developer can fix this in Vercel.
            </p>
          </div>
        ) : null}
        {delivery && delivery.sendgridConfigured && !delivery.officeNotificationConfigured ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
            <p className="font-semibold">No optional office email copy</p>
            <p className="mt-1">
              <code className="rounded bg-white/80 px-1">OFFICE_NOTIFICATION_EMAIL</code> is not set on this server.
              That is fine for front desk â€” use this inbox. To also email Sean (
              <code className="rounded bg-white/80 px-1">dr.seanwelborn@gmail.com</code>), set it in Vercel â†’
              Production environment variables.
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {(["new", "read", "archived", "all"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                filter === s ? "bg-[#c0392b] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              {s}
              {s === "new" && newCount > 0 ? ` (${newCount})` : ""}
            </button>
          ))}
        </div>

        {error ? (
          <p className="rounded-lg bg-rose-100 px-4 py-2 text-sm text-rose-900">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-600">Loadingâ€¦</p>
        ) : submissions.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
            No messages in this view.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <ul className="max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {submissions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(s.id);
                      if (s.status === "new") void setStatus(s.id, "read");
                    }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                      selected?.id === s.id ? "bg-[#f0faf9]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-900">{s.name}</span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          s.status === "new"
                            ? "bg-amber-100 text-amber-900"
                            : s.status === "archived"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{s.topic ?? "General"} Â· {formatWhen(s.createdAt)}</p>
                    {!s.officeEmailSent ? (
                      <p className="mt-1 text-xs text-slate-500">Optional office email copy not sent</p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>

            {selected ? (
              <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{selected.name}</h2>
                    <p className="text-sm text-slate-600">{selected.topic ?? "General inquiry"}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatWhen(selected.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(`Re: ${selected.topic ?? "Your message"}`)}`}
                      className="rounded-full bg-[#c0392b] px-4 py-2 text-xs font-bold text-white"
                    >
                      Reply by email
                    </a>
                    {selected.status !== "archived" ? (
                      <button
                        type="button"
                        onClick={() => void setStatus(selected.id, "archived")}
                        className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void setStatus(selected.id, "read")}
                        className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-slate-500">Email</dt>
                    <dd>
                      <a className="text-[#c0392b] underline" href={`mailto:${selected.email}`}>
                        {selected.email}
                      </a>
                    </dd>
                  </div>
                  {selected.phone ? (
                    <div>
                      <dt className="font-semibold text-slate-500">Phone</dt>
                      <dd>
                        <a className="text-[#c0392b] underline" href={`tel:${selected.phone}`}>
                          {selected.phone}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  <div className="sm:col-span-2">
                    <dt className="font-semibold text-slate-500">Delivery</dt>
                    <dd className="text-slate-700">
                      Office email: {selected.officeEmailSent ? "sent" : "not sent"} Â· Visitor auto-reply:{" "}
                      {selected.autoReplySent ? "sent" : "not sent"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-500">Message</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {selected.message}
                  </p>
                </div>
              </article>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminContactPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm">Loadingâ€¦</div>}>
      <ContactInbox />
    </Suspense>
  );
}
