"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FirebaseError } from "firebase/app";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

function actionErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/expired-action-code":
        return "This link has expired. Ask a superadmin to send you a new password reset link.";
      case "auth/invalid-action-code":
        return "This link is invalid or was already used. Ask a superadmin to send a new password reset link.";
      case "auth/weak-password":
        return "Choose a stronger password (at least 6 characters).";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a few minutes and try again.";
      default:
        return `Could not reset password (${err.code}).`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Could not reset password.";
}

function safeContinuePath(raw: string | null): string {
  if (!raw) return "/auth/password-reset-complete";
  try {
    const url = new URL(raw);
    if (url.pathname.startsWith("/")) return url.pathname;
  } catch {
    /* ignore */
  }
  return "/auth/password-reset-complete";
}

function AuthActionContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const continueUrl = searchParams.get("continueUrl");

  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "resetPassword") {
      setLoading(false);
      if (mode) setError("This link type is not supported here. Use the staff sign-in page instead.");
      return;
    }
    if (!oobCode) {
      setLoading(false);
      setError("This link is missing a reset code. Ask a superadmin to send a new password reset link.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const auth = getFirebaseClientAuth();
        const accountEmail = await verifyPasswordResetCode(auth, oobCode);
        if (!cancelled) setEmail(accountEmail);
      } catch (err) {
        if (!cancelled) setError(actionErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, oobCode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!oobCode || mode !== "resetPassword") return;
    setError(null);
    setBusy(true);
    try {
      const auth = getFirebaseClientAuth();
      await confirmPasswordReset(auth, oobCode, password);
      window.location.assign(safeContinuePath(continueUrl));
    } catch (err) {
      setError(actionErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-600">
        Verifying your link…
      </div>
    );
  }

  if (mode !== "resetPassword" || error) {
    return (
      <div className="mx-auto max-w-md space-y-6 px-4 py-16">
        <div className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-rose-950">Link problem</h1>
          <p className="text-sm text-rose-900">{error ?? "This link could not be opened."}</p>
          <Link
            href="/admin/login"
            className="inline-flex justify-center rounded-full bg-rose-900 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-800"
          >
            Staff sign-in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c0392b]">Staff portal</p>
        <h1 className="text-2xl font-semibold text-slate-900">Set your password</h1>
        {email ? (
          <p className="text-sm text-slate-600">
            Create a password for <strong>{email}</strong>.
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-700">
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[#c0392b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a93226] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-600">
          Loading…
        </div>
      }
    >
      <AuthActionContent />
    </Suspense>
  );
}
