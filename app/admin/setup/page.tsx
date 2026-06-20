"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import type { StaffRole } from "@/lib/staff-roles";

type Me = {
  authenticated: boolean;
  role?: StaffRole | null;
  email?: string | null;
};

type EmailStatus = {
  sendgridConfigured: boolean;
  hasApiKey: boolean;
  hasFromEmail: boolean;
  fromEnvInvalidFormat?: boolean;
};

export default function AdminSetupPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/login?next=/admin/setup");
        return;
      }
      const token = await user.getIdToken();
      const [meRes, emailRes] = await Promise.all([
        fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/email-status", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const meData = (await meRes.json()) as Me;
      setMe(meData);
      if (meData.role) {
        router.replace("/admin");
        return;
      }
      if (emailRes.ok) {
        setEmailStatus((await emailRes.json()) as EmailStatus);
      }
      setReady(true);
    });
    return () => unsub();
  }, [auth, router]);

  async function runBootstrap() {
    setMessage(null);
    if (!auth?.currentUser) return;
    setBusy(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ secret: bootstrapSecret }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Setup failed.");
        return;
      }
      setMessage("Setup complete. Redirecting…");
      setBootstrapSecret("");
      await auth.currentUser.getIdToken(true);
      router.replace("/admin/super");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="bg-[#f4f2ea] px-4 py-16 text-center text-sm text-stone-600">
        Checking account…
      </div>
    );
  }

  return (
    <div className="bg-[#f4f2ea]">
      <div className="mx-auto max-w-md space-y-6 px-4 py-16">
        <div className="border-t-4 border-[#c0392b] bg-white p-6 text-center shadow-md">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#c0392b]">Staff setup</p>
          <h1 className="mt-2 text-2xl font-black text-[#4a1515]">First-time owner setup</h1>
          <p className="mt-2 text-sm text-stone-700">
            This page is for the clinic owner or web person setting up the first administrator account.
            Front desk and therapists should not use this — they receive an invite email from a manager.
          </p>
          {me?.email ? (
            <p className="mt-3 text-xs text-stone-500">
              Signed in as <span className="font-semibold">{me.email}</span>
            </p>
          ) : null}
        </div>

        {emailStatus ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              emailStatus.sendgridConfigured
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
          >
            {emailStatus.sendgridConfigured ? (
              <p>
                <strong>Invite emails are configured.</strong> After setup you can invite staff by email
                from Scheduling &amp; team.
              </p>
            ) : (
              <p>
                <strong>Invite emails are not fully configured.</strong> You can still add staff, but
                invites may show a one-time password instead of an email until SendGrid is set up on
                this deployment.
              </p>
            )}
          </div>
        ) : null}

        <section className="space-y-4 border-t-4 border-[#c0392b] bg-white p-6 shadow-md">
          <p className="text-sm text-stone-700">
            Enter the one-time setup code from your web person, then run setup. You will become a
            superadmin and can invite team members.
          </p>
          <label className="block space-y-1 text-sm">
            <span className="font-bold text-[#4a1515]">Setup code</span>
            <input
              className="w-full border border-stone-300 px-3 py-2"
              placeholder="Setup code"
              value={bootstrapSecret}
              onChange={(e) => setBootstrapSecret(e.target.value)}
              autoComplete="off"
            />
          </label>
          {message ? <p className="text-sm text-stone-800">{message}</p> : null}
          <button
            type="button"
            onClick={runBootstrap}
            disabled={busy || !bootstrapSecret.trim()}
            className="w-full bg-[#c0392b] py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#962d22] disabled:opacity-50"
          >
            {busy ? "Running setup…" : "Run setup"}
          </button>
        </section>

        <p className="text-center text-sm text-stone-600">
          Were you invited as staff?{" "}
          <Link href="/admin/login" className="font-semibold text-[#c0392b] underline">
            Return to sign-in
          </Link>{" "}
          and ask your manager to re-send your invite.
        </p>
      </div>
    </div>
  );
}
