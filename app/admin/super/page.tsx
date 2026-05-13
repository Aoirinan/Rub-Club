"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

type Me = {
  authenticated: boolean;
  role?: "admin" | "superadmin" | null;
  email?: string | null;
};

type StaffRow = { uid: string; role?: string; email?: string };

export default function SuperAdminPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  async function loadStaff(token: string) {
    const res = await fetch("/api/admin/staff", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { staff: StaffRow[] };
    setStaff(data.staff);
  }

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as Me;
      setMe(data);
      if (data.role !== "superadmin") {
        router.replace("/admin");
        return;
      }
      await loadStaff(token);
    });
    return () => unsub();
  }, [auth, router]);

  async function submitStaff() {
    setMessage(null);
    if (!auth) return;
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(typeof data.error === "string" ? data.error : "Could not save staff.");
      return;
    }
    setMessage("Saved.");
    setEmail("");
    await loadStaff(token);
  }

  async function runBootstrap() {
    setMessage(null);
    if (!auth) return;
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/admin/bootstrap", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ secret: bootstrapSecret }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(typeof data.error === "string" ? data.error : "Bootstrap failed.");
      return;
    }
    setMessage("Bootstrap complete. You are now superadmin.");
    setBootstrapSecret("");
    const fresh = await user.getIdToken(true);
    await loadStaff(fresh);
    router.replace("/admin");
  }

  if (me?.role !== "superadmin") {
    return (
      <div className="px-4 py-16 text-center text-sm text-slate-600">Checking permissions…</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Superadmin</h1>
        <Link href="/admin" className="text-sm font-semibold text-slate-900 hover:underline">
          Back to bookings
        </Link>
      </div>

      {message ? <p className="text-sm text-slate-800">{message}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Grant staff access</h2>
        <p className="text-sm text-slate-600">
          The person must already exist in Firebase Authentication (email/password). This writes a
          Firestore document at <code className="rounded bg-slate-100 px-1">{`staff/<uid>`}</code>.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-800">Email</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-800">Role</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "superadmin")}
            >
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={submitStaff}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Save
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Bootstrap (first superadmin)</h2>
        <p className="text-sm text-slate-600">
          Set the environment variable <code className="rounded bg-slate-100 px-1">ADMIN_BOOTSTRAP_SECRET</code>{" "}
          on the server, sign in here, paste the same secret, and run once to grant yourself the superadmin
          role.
        </p>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Bootstrap secret"
          value={bootstrapSecret}
          onChange={(e) => setBootstrapSecret(e.target.value)}
        />
        <button
          type="button"
          onClick={runBootstrap}
          className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
        >
          Run bootstrap
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Current staff documents</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          {staff.map((s) => (
            <li key={s.uid} className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs">
              <div className="font-semibold text-slate-900">{s.email ?? s.uid}</div>
              <div>uid: {s.uid}</div>
              <div>role: {s.role}</div>
            </li>
          ))}
          {staff.length === 0 ? <li className="text-slate-600">No rows returned.</li> : null}
        </ul>
      </section>
    </div>
  );
}
