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

type EmailStatus = {
  sendgridConfigured: boolean;
  hasApiKey: boolean;
  hasFromEmail: boolean;
  fromEnvInvalidFormat?: boolean;
};

type InviteStaffResponse = {
  ok?: boolean;
  error?: string;
  uid?: string;
  role?: string;
  createdNewAuthUser?: boolean;
  emailedReset?: boolean;
  inviteEmailIssue?: "missing_env" | "sendgrid_error" | "reset_link_failed" | null;
  inviteEmailDetail?: string;
  temporaryPassword?: string;
  passwordWarning?: string;
};

type BookableProviderRow = {
  id: string;
  displayName: string;
  active: boolean;
  locationIds: string[];
  serviceLines: string[];
  sortOrder: number;
  schedule?: {
    openHour: number;
    openMinute: number;
    closeHour: number;
    closeMinute: number;
  } | null;
};

function inviteEmailIssueHint(issue?: InviteStaffResponse["inviteEmailIssue"]): string {
  if (issue === "missing_env") {
    return " No email was sent: add SENDGRID_API_KEY and SENDGRID_FROM_EMAIL to this app’s Production env in Vercel (they are per-project, not shared with your other software).";
  }
  if (issue === "sendgrid_error") {
    return " No email was sent: SendGrid rejected this request (see the SendGrid line below if present). Common causes: API key not granted “Mail Send”, Preview deployment without env vars, or “from” not verified for this key.";
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
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [bookableProviders, setBookableProviders] = useState<BookableProviderRow[]>([]);
  const [newProviderName, setNewProviderName] = useState("");
  const [newParis, setNewParis] = useState(true);
  const [newSulphur, setNewSulphur] = useState(true);
  const [newMassage, setNewMassage] = useState(true);
  const [newChiro, setNewChiro] = useState(true);
  const [newSort, setNewSort] = useState(0);
  const [editingProvider, setEditingProvider] = useState<BookableProviderRow | null>(null);
  const [savingProvider, setSavingProvider] = useState(false);

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

  async function loadEmailStatus(token: string) {
    const res = await fetch("/api/admin/email-status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setEmailStatus(null);
      return;
    }
    setEmailStatus((await res.json()) as EmailStatus);
  }

  async function loadBookableProviders(token: string) {
    const res = await fetch("/api/admin/providers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setBookableProviders([]);
      return;
    }
    const data = (await res.json()) as { providers?: BookableProviderRow[] };
    setBookableProviders(data.providers ?? []);
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
        await loadEmailStatus(token);
        await loadBookableProviders(token);
      } else {
        setStaff([]);
        setEmailStatus(null);
        setBookableProviders([]);
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
          `${data.passwordWarning ?? "Share this password once, securely."} Temporary password: ${data.temporaryPassword}${issueNote}`,
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
    const joined = parts.join(" ");
    const detail =
      typeof data.inviteEmailDetail === "string" && data.inviteEmailDetail.length > 0
        ? ` SendGrid: ${data.inviteEmailDetail}`
        : "";
    setMessage(`${joined}${detail}`);
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

  async function createBookableProvider() {
    setMessage(null);
    if (!auth?.currentUser) return;
    const locationIds = [
      ...(newParis ? (["paris"] as const) : []),
      ...(newSulphur ? (["sulphur_springs"] as const) : []),
    ];
    const serviceLines = [
      ...(newMassage ? (["massage"] as const) : []),
      ...(newChiro ? (["chiropractic"] as const) : []),
    ];
    if (!newProviderName.trim() || locationIds.length === 0 || serviceLines.length === 0) {
      setMessage("Add a display name and select at least one location and one service.");
      return;
    }
    setSavingProvider(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          displayName: newProviderName.trim(),
          locationIds,
          serviceLines,
          sortOrder: newSort,
          active: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Could not create provider.");
        return;
      }
      setMessage(
        "Provider added. They appear on the public booking page for the locations and services you selected.",
      );
      setNewProviderName("");
      setNewSort(0);
      await loadBookableProviders(token);
    } finally {
      setSavingProvider(false);
    }
  }

  async function saveBookableProviderEdit() {
    setMessage(null);
    if (!editingProvider || !auth?.currentUser) return;
    const locationIds = editingProvider.locationIds.filter(
      (x): x is "paris" | "sulphur_springs" => x === "paris" || x === "sulphur_springs",
    );
    const serviceLines = editingProvider.serviceLines.filter(
      (x): x is "massage" | "chiropractic" => x === "massage" || x === "chiropractic",
    );
    if (!editingProvider.displayName.trim() || locationIds.length === 0 || serviceLines.length === 0) {
      setMessage("Display name, location(s), and service(s) are required.");
      return;
    }
    setSavingProvider(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/providers/${editingProvider.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          displayName: editingProvider.displayName.trim(),
          locationIds,
          serviceLines,
          sortOrder: editingProvider.sortOrder,
          active: editingProvider.active,
          schedule: editingProvider.schedule ?? null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Could not save provider.");
        return;
      }
      setMessage("Provider updated.");
      setEditingProvider(null);
      await loadBookableProviders(token);
    } finally {
      setSavingProvider(false);
    }
  }

  async function hideBookableProvider(id: string, label: string) {
    setMessage(null);
    if (!auth?.currentUser) return;
    if (!window.confirm(`Hide "${label}" from public booking? Existing bookings stay as-is.`)) return;
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`/api/admin/providers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMessage(typeof data.error === "string" ? data.error : "Could not deactivate.");
      return;
    }
    setMessage("Provider hidden from booking.");
    if (editingProvider?.id === id) setEditingProvider(null);
    await loadBookableProviders(token);
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
    await loadEmailStatus(fresh);
    await loadBookableProviders(fresh);
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
          {emailStatus?.fromEnvInvalidFormat ? (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-950">
              <p className="font-medium">SendGrid “from” value is not a valid email</p>
              <p className="mt-2">
                Vercel has something in <code className="rounded bg-white/80 px-1">sendgridfromemail</code> /{" "}
                <code className="rounded bg-white/80 px-1">SENDGRID_FROM_EMAIL</code>, but after cleaning it is still not
                a plain address like <code className="rounded bg-white/80 px-1">russell_forsyth_1992@outlook.com</code>.
                Remove wrapping quotes, extra spaces, or newlines. If the value starts with{" "}
                <code className="rounded bg-white/80 px-1">SG.</code>, you swapped the API key into the wrong variable —
                put the key only in <code className="rounded bg-white/80 px-1">SENDGRID_API_KEY</code> or{" "}
                <code className="rounded bg-white/80 px-1">send_grid</code>.
              </p>
            </section>
          ) : null}

          {emailStatus && !emailStatus.sendgridConfigured && !emailStatus.fromEnvInvalidFormat ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
              <p className="font-medium">SendGrid is not available on this deployment</p>
              <p className="mt-2 text-amber-900/90">
                The production server does not see both environment variables. Missing:{" "}
                <strong>
                  {[!emailStatus.hasApiKey ? "SENDGRID_API_KEY" : null, !emailStatus.hasFromEmail ? "SENDGRID_FROM_EMAIL" : null]
                    .filter(Boolean)
                    .join(" and ")}
                </strong>
                .
              </p>
              <p className="mt-2">
                In{" "}
                <a
                  href="https://vercel.com/dashboard"
                  className="font-semibold underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vercel
                </a>
                , open <strong>this project</strong> (the one that serves this URL) → Settings → Environment
                Variables. For each variable, set <strong>Environment = Production</strong> (not only Preview), save,
                then trigger a new deployment so serverless functions pick up the values.
              </p>
            </section>
          ) : emailStatus?.sendgridConfigured ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              Outbound email (SendGrid) is configured on this deployment — invite emails can be sent.
            </p>
          ) : null}

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

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Bookable providers (public scheduling)</h2>
            <p className="text-sm text-slate-600">
              Each row is a person clients can book. Two providers can share the same time at one location because
              slots are tracked per provider. Optional custom hours override the default 9:00–17:00 Chicago window for
              that person only.
            </p>

            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
              <p className="text-sm font-medium text-slate-800">Add provider</p>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-800">Display name</span>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder="e.g. Jamie Nguyen, LMT"
                />
              </label>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="font-medium text-slate-800">Locations</span>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={newParis} onChange={(e) => setNewParis(e.target.checked)} />
                  Paris
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={newSulphur} onChange={(e) => setNewSulphur(e.target.checked)} />
                  Sulphur Springs
                </label>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="font-medium text-slate-800">Services</span>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={newMassage} onChange={(e) => setNewMassage(e.target.checked)} />
                  Massage
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={newChiro} onChange={(e) => setNewChiro(e.target.checked)} />
                  Chiropractic
                </label>
              </div>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-800">Sort order (lower first in lists)</span>
                <input
                  type="number"
                  className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2"
                  value={newSort}
                  onChange={(e) => setNewSort(Number(e.target.value))}
                />
              </label>
              <button
                type="button"
                disabled={savingProvider}
                onClick={createBookableProvider}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {savingProvider ? "Saving…" : "Add provider"}
              </button>
            </div>

            {editingProvider ? (
              <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-sm">
                <p className="font-medium text-slate-900">Edit provider</p>
                <label className="block space-y-1">
                  <span className="font-medium text-slate-800">Display name</span>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    value={editingProvider.displayName}
                    onChange={(e) =>
                      setEditingProvider((prev) => (prev ? { ...prev, displayName: e.target.value } : prev))
                    }
                  />
                </label>
                <div className="flex flex-wrap gap-4">
                  <span className="font-medium text-slate-800">Locations</span>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProvider.locationIds.includes("paris")}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setEditingProvider((prev) => {
                          if (!prev) return prev;
                          const next = new Set(prev.locationIds);
                          if (on) next.add("paris");
                          else next.delete("paris");
                          return { ...prev, locationIds: Array.from(next) };
                        });
                      }}
                    />
                    Paris
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProvider.locationIds.includes("sulphur_springs")}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setEditingProvider((prev) => {
                          if (!prev) return prev;
                          const next = new Set(prev.locationIds);
                          if (on) next.add("sulphur_springs");
                          else next.delete("sulphur_springs");
                          return { ...prev, locationIds: Array.from(next) };
                        });
                      }}
                    />
                    Sulphur Springs
                  </label>
                </div>
                <div className="flex flex-wrap gap-4">
                  <span className="font-medium text-slate-800">Services</span>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProvider.serviceLines.includes("massage")}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setEditingProvider((prev) => {
                          if (!prev) return prev;
                          const next = new Set(prev.serviceLines);
                          if (on) next.add("massage");
                          else next.delete("massage");
                          return { ...prev, serviceLines: Array.from(next) };
                        });
                      }}
                    />
                    Massage
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProvider.serviceLines.includes("chiropractic")}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setEditingProvider((prev) => {
                          if (!prev) return prev;
                          const next = new Set(prev.serviceLines);
                          if (on) next.add("chiropractic");
                          else next.delete("chiropractic");
                          return { ...prev, serviceLines: Array.from(next) };
                        });
                      }}
                    />
                    Chiropractic
                  </label>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProvider.active}
                    onChange={(e) =>
                      setEditingProvider((prev) => (prev ? { ...prev, active: e.target.checked } : prev))
                    }
                  />
                  Active (shown on public booking)
                </label>
                <label className="block space-y-1">
                  <span className="font-medium text-slate-800">Sort order</span>
                  <input
                    type="number"
                    className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2"
                    value={editingProvider.sortOrder}
                    onChange={(e) =>
                      setEditingProvider((prev) =>
                        prev ? { ...prev, sortOrder: Number(e.target.value) || 0 } : prev,
                      )
                    }
                  />
                </label>
                <div className="space-y-2">
                  <p className="font-medium text-slate-800">Custom hours (optional)</p>
                  {editingProvider.schedule ? (
                    <div className="grid gap-2 sm:grid-cols-4">
                      <label className="space-y-1">
                        <span className="text-xs text-slate-600">Open H</span>
                        <input
                          type="number"
                          className="w-full rounded border border-slate-300 px-2 py-1"
                          value={editingProvider.schedule.openHour}
                          onChange={(e) =>
                            setEditingProvider((prev) =>
                              prev?.schedule
                                ? {
                                    ...prev,
                                    schedule: { ...prev.schedule, openHour: Number(e.target.value) || 0 },
                                  }
                                : prev,
                            )
                          }
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-slate-600">Open M</span>
                        <input
                          type="number"
                          className="w-full rounded border border-slate-300 px-2 py-1"
                          value={editingProvider.schedule.openMinute}
                          onChange={(e) =>
                            setEditingProvider((prev) =>
                              prev?.schedule
                                ? {
                                    ...prev,
                                    schedule: { ...prev.schedule, openMinute: Number(e.target.value) || 0 },
                                  }
                                : prev,
                            )
                          }
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-slate-600">Close H</span>
                        <input
                          type="number"
                          className="w-full rounded border border-slate-300 px-2 py-1"
                          value={editingProvider.schedule.closeHour}
                          onChange={(e) =>
                            setEditingProvider((prev) =>
                              prev?.schedule
                                ? {
                                    ...prev,
                                    schedule: { ...prev.schedule, closeHour: Number(e.target.value) || 0 },
                                  }
                                : prev,
                            )
                          }
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-slate-600">Close M</span>
                        <input
                          type="number"
                          className="w-full rounded border border-slate-300 px-2 py-1"
                          value={editingProvider.schedule.closeMinute}
                          onChange={(e) =>
                            setEditingProvider((prev) =>
                              prev?.schedule
                                ? {
                                    ...prev,
                                    schedule: { ...prev.schedule, closeMinute: Number(e.target.value) || 0 },
                                  }
                                : prev,
                            )
                          }
                        />
                      </label>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {editingProvider.schedule ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-slate-700 underline"
                        onClick={() => setEditingProvider((prev) => (prev ? { ...prev, schedule: null } : prev))}
                      >
                        Use default site hours (9–17)
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-900"
                        onClick={() =>
                          setEditingProvider((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  schedule: {
                                    openHour: 9,
                                    openMinute: 0,
                                    closeHour: 17,
                                    closeMinute: 0,
                                  },
                                }
                              : prev,
                          )
                        }
                      >
                        Set custom hours
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingProvider}
                    onClick={saveBookableProviderEdit}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProvider(null)}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            <ul className="space-y-2 text-sm text-slate-700">
              {bookableProviders.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="font-semibold text-slate-900">{p.displayName}</div>
                    <div className="text-xs text-slate-600">
                      {p.active ? (
                        <span className="text-emerald-800">Active</span>
                      ) : (
                        <span className="text-amber-800">Hidden</span>
                      )}{" "}
                      · sort {p.sortOrder} · id <span className="font-mono">{p.id}</span>
                    </div>
                    <div className="text-xs">
                      Locations: {p.locationIds.join(", ") || "—"} · Services:{" "}
                      {p.serviceLines.join(", ") || "—"}
                    </div>
                    {p.schedule ? (
                      <div className="text-xs text-slate-600">
                        Hours: {p.schedule.openHour}:{String(p.schedule.openMinute).padStart(2, "0")}–
                        {p.schedule.closeHour}:{String(p.schedule.closeMinute).padStart(2, "0")}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600">Hours: default 9:00–17:00 (Chicago)</div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProvider({ ...p })}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:border-slate-400"
                    >
                      Edit
                    </button>
                    {p.active ? (
                      <button
                        type="button"
                        onClick={() => hideBookableProvider(p.id, p.displayName)}
                        className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50"
                      >
                        Hide
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
              {bookableProviders.length === 0 ? (
                <li className="text-slate-600">No provider documents yet. Add your team above.</li>
              ) : null}
            </ul>
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
