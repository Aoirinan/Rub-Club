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

type InviteStaffResponse = {
  ok?: boolean;
  error?: string;
  uid?: string;
  role?: string;
  createdNewAuthUser?: boolean;
  emailedReset?: boolean;
  inviteEmailIssue?: "missing_env" | "sendgrid_error" | "reset_link_failed" | null;
  temporaryPassword?: string;
  passwordWarning?: string;
};

function inviteEmailIssueHint(issue?: InviteStaffResponse["inviteEmailIssue"]): string {
  if (issue === "missing_env") {
    return " No email was sent: add SENDGRID_API_KEY and SENDGRID_FROM_EMAIL to this app’s Production env in Vercel (they are per-project, not shared with your other software).";
  }
  if (issue === "sendgrid_error") {
    return " No email was sent: SendGrid rejected the API call from this deployment (often a different API key than your other app, or the “from” address is not verified for this key). Check Vercel → this project → Logs for /api/admin/invite-staff.";
  }
  if (issue === "reset_link_failed") {
    return " Password reset link could not be created in Firebase; email was not attempted.";
  }
  return "";
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [meReady, setMeReady] = useState(false);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

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
      setMeReady(true);
      if (data.role === "superadmin") {
        await loadStaff(token);
      } else {
        setStaff([]);
      }
    });
    return () => unsub();
  }, [auth, router]);

  async function submitStaff() {
    setMessage(null);
    if (!auth) return;
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/admin/invite-staff", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    const data = (await res.json().catch(() => ({}))) as InviteStaffResponse;
    if (!res.ok) {
      setMessage(typeof data.error === "string" ? data.error : "Could not save staff.");
      return;
    }
    const parts: string[] = [];
    const issueNote = inviteEmailIssueHint(data.inviteEmailIssue);
    if (data.createdNewAuthUser) {
      if (data.emailedReset) {
        parts.push("New account created. They should receive an email with a link to set their password.");
      } else if (data.temporaryPassword) {
        parts.push(
          `${data.passwordWarning ?? "Share this password once, securely."} Temporary password: ${data.temporaryPassword}`,
        );
      } else {
        parts.push(`New account created.${issueNote}`);
      }
    } else if (data.emailedReset) {
      parts.push(
        "Staff access updated. They should receive an email with a link to open the portal or reset their password.",
      );
    } else {
      parts.push(
        `Staff access was saved, but no invitation email was sent.${issueNote} They can still use “Forgot password” on the staff login page with their work email once mail is working.`,
      );
    }
    setMessage(parts.join(" "));
    setEmail("");
    await loadStaff(token);
  }

  async function deleteStaffRow(targetUid: string) {
    setMessage(null);
    if (!auth?.currentUser) return;
    if (targetUid === auth.currentUser.uid) return;
    const label =
      staff.find((s) => s.uid === targetUid)?.email ?? targetUid.slice(0, 8) + "…";
    if (
      !window.confirm(
        `Remove ${label} completely? This deletes their staff record and their Firebase sign-in account. You can invite them again later (a new account will be created if needed).`,
      )
    ) {
      return;
    }
    setDeletingUid(targetUid);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/staff?uid=${encodeURIComponent(targetUid)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Could not remove staff.");
        return;
      }
      setMessage("Staff access and sign-in account removed.");
      await loadStaff(token);
    } finally {
      setDeletingUid(null);
    }
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
    const meRes = await fetch("/api/admin/me", {
      headers: { Authorization: `Bearer ${fresh}` },
    });
    setMe((await meRes.json()) as Me);
    await loadStaff(fresh);
  }

  if (!meReady) {
    return (
      <div className="px-4 py-16 text-center text-sm text-slate-600">Checking permissions…</div>
    );
  }

  const isSuper = me?.role === "superadmin";
  const isEmployee = me?.role === "admin";
  const needsBootstrap = !me?.role;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isSuper ? "Superadmin" : needsBootstrap ? "Staff setup" : "Access"}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Build {process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown"}
          </p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-slate-900 hover:underline">
          Back to bookings
        </Link>
      </div>

      {message ? <p className="text-sm text-slate-800">{message}</p> : null}

      {isEmployee ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-medium">Employee access</p>
          <p className="mt-2">
            Your account is <strong>admin</strong> (employee): you can use <Link href="/admin" className="font-semibold underline">Bookings</Link>{" "}
            but not this management page. Ask a <strong>manager (superadmin)</strong> to promote you if you need to invite staff.
          </p>
        </section>
      ) : null}

      {needsBootstrap ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Become manager (first superadmin)</h2>
          <p className="text-sm text-slate-600">
            Put <code className="rounded bg-slate-100 px-1">ADMIN_BOOTSTRAP_SECRET</code> in your server
            environment (e.g. Vercel → Environment Variables → Production), redeploy, paste the same secret here,
            and run once. Then you can grant <strong>employee</strong> or <strong>manager</strong> roles below.
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
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Run bootstrap
          </button>
        </section>
      ) : null}

      {isSuper ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Add or invite staff</h2>
            <p className="text-sm text-slate-600">
              Enter their work email. If they do not have a sign-in yet, the app creates the account and either
              emails them a password-reset link (when SendGrid is configured) or shows you a one-time temporary
              password to share securely. Creates or updates <code className="rounded bg-slate-100 px-1">{`staff/<uid>`}</code>{" "}
              in Firestore.
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-600">
              <li>
                <strong>Employee (admin)</strong> — view bookings and cancel slots.
              </li>
              <li>
                <strong>Manager (superadmin)</strong> — same as employee, plus this page (invite staff, see staff
                list).
              </li>
            </ul>
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
                <span className="font-medium text-slate-800">Access level</span>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "superadmin")}
                >
                  <option value="admin">Employee (admin)</option>
                  <option value="superadmin">Manager (superadmin)</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={submitStaff}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add or invite
            </button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Bootstrap again (optional)</h2>
            <p className="text-sm text-slate-600">
              Only needed if you rotate the secret and must recover access. Prefer granting roles above.
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
              {staff.map((s) => {
                const isSelf = auth?.currentUser?.uid === s.uid;
                return (
                  <li
                    key={s.uid}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-semibold text-slate-900">{s.email ?? s.uid}</div>
                      <div>uid: {s.uid}</div>
                      <div>role: {s.role}</div>
                      {isSelf ? (
                        <div className="font-sans text-[11px] text-slate-500">
                          You cannot remove yourself here; another manager must revoke your access.
                        </div>
                      ) : null}
                    </div>
                    {!isSelf ? (
                      <button
                        type="button"
                        disabled={deletingUid === s.uid}
                        onClick={() => deleteStaffRow(s.uid)}
                        className="shrink-0 rounded-full border border-red-200 bg-white px-3 py-1.5 font-sans text-xs font-semibold text-red-700 hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingUid === s.uid ? "Removing…" : "Remove access"}
                      </button>
                    ) : null}
                  </li>
                );
              })}
              {staff.length === 0 ? <li className="text-slate-600">No rows returned.</li> : null}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
