"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { completeStaffSignIn } from "@/lib/staff-sign-in-client";

function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Wrong email or password, or this account does not have staff access.";
      case "auth/invalid-email":
        return "That email address does not look valid.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact your administrator.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait several minutes, then try again.";
      case "auth/operation-not-allowed":
        return "Email and password sign-in is not enabled for this site. Contact your administrator.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      case "auth/unauthorized-continue-uri":
        return "Password reset could not start because this site’s domain is not authorized in Firebase. Ask your administrator to add rub-club.vercel.app (and your production domain) under Firebase Auth → Settings → Authorized domains.";
      case "auth/invalid-api-key":
        return "Sign-in could not be completed because of a site configuration issue. Your administrator may need to update API keys or allowed domains for this app.";
      default:
        if (err.code.includes("api-key")) {
          return "Sign-in could not be completed because of a site configuration issue. Your administrator may need to update API keys or allowed domains for this app.";
        }
        return `Sign-in failed (${err.code}).`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Could not sign in.";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [noStaffAccess, setNoStaffAccess] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotBusy, setForgotBusy] = useState(false);

  const nextPath = searchParams.get("next");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNoStaffAccess(false);
    setBusy(true);
    try {
      const auth = getFirebaseClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const result = await completeStaffSignIn(cred);
      if (!result.ok) {
        setNoStaffAccess(true);
        setError(
          "Your account signed in successfully but does not have staff access yet.",
        );
        return;
      }
      const destination =
        nextPath && nextPath.startsWith("/admin") ? nextPath : "/admin";
      router.replace(destination);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function requestPasswordReset() {
    setForgotMessage(null);
    setForgotBusy(true);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setForgotMessage(typeof data.error === "string" ? data.error : "Could not send reset email.");
        return;
      }
      setForgotMessage(
        typeof data.message === "string"
          ? data.message
          : "If an account with that email exists, we sent password reset instructions.",
      );
    } finally {
      setForgotBusy(false);
    }
  }

  return (
    <div className="bg-[#f4f2ea]">
      <div className="mx-auto max-w-md space-y-6 px-4 py-16">
        <div className="border-t-4 border-[#c0392b] bg-white p-6 text-center shadow-md">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#c0392b]">Staff Login</p>
          <h1 className="mt-2 text-2xl font-black text-[#4a1515]">Staff sign-in</h1>
          <p className="mt-2 text-sm text-stone-700">
            Use the email and password your administrator created for you. If you were just invited,
            open the link in your invite email to set your password first.
          </p>
          <p className="mt-2 text-xs text-stone-600">
            Use at least 8 characters with letters and numbers. Choose a unique password not shared
            with personal accounts.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 border-t-4 border-[#c0392b] bg-white p-6 shadow-md">
          <label className="block space-y-1 text-sm">
            <span className="font-bold text-[#4a1515]">Email</span>
            <input
              className="w-full border border-stone-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              type="email"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-bold text-[#4a1515]">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-stone-300 px-3 py-2 pr-16"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#c0392b] underline"
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          <p className="text-xs text-stone-600">
            {showForgot ? (
              <>
                Enter your staff email and we&apos;ll send a reset link when an account exists.{" "}
                <button
                  type="button"
                  className="font-semibold text-[#c0392b] underline"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotMessage(null);
                  }}
                >
                  Back to sign-in
                </button>
              </>
            ) : (
              <>
                Forgot your password?{" "}
                <button
                  type="button"
                  className="font-semibold text-[#c0392b] underline"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotMessage(null);
                    setError(null);
                  }}
                >
                  Send yourself a reset link
                </button>{" "}
                or ask a superadmin from <strong>Scheduling &amp; team</strong>.
              </>
            )}
          </p>
          {showForgot ? (
            <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
              <button
                type="button"
                disabled={forgotBusy || !email.trim()}
                onClick={() => void requestPasswordReset()}
                className="w-full border border-[#c0392b] bg-white py-2 text-sm font-bold uppercase tracking-wide text-[#c0392b] hover:bg-[#fdf6f5] disabled:opacity-50"
              >
                {forgotBusy ? "Sending…" : "Email reset link"}
              </button>
              {forgotMessage ? <p className="text-sm text-stone-700">{forgotMessage}</p> : null}
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {noStaffAccess ? (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <p>
                <Link href="/admin/setup" className="font-semibold underline">
                  First-time owner? Run setup
                </Link>
              </p>
              <p>
                Invited staff should ask their manager to re-send the invite, then try again here.
              </p>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#c0392b] py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#962d22] disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="space-y-2 border-t border-stone-300 pt-4 text-center text-xs text-stone-600">
          <p>For Chiropractic Associates staff only. Unauthorized access is prohibited.</p>
          <p>
            <Link href="/website-privacy" className="font-semibold text-[#c0392b] underline">
              Website privacy &amp; cookies
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
