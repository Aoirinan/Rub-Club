"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { getPublicAppOrigin } from "@/lib/app-origin";

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
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [noStaffAccess, setNoStaffAccess] = useState(false);

  const nextPath = searchParams.get("next");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setNoStaffAccess(false);
    setBusy(true);
    try {
      const auth = getFirebaseClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await cred.user.getIdToken();
      const meRes = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const me = (await meRes.json()) as { role?: string | null };
      if (!me.role) {
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

  async function onForgotPassword() {
    setError(null);
    setInfo(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your work email above, then click Forgot password.");
      return;
    }
    setResetBusy(true);
    try {
      const auth = getFirebaseClientAuth();
      const origin = getPublicAppOrigin();
      await sendPasswordResetEmail(auth, trimmed, {
        url: `${origin}/auth/password-reset-complete`,
        handleCodeInApp: false,
      });
      setInfo("If that email has an account, a password reset link was sent. Check your inbox.");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setResetBusy(false);
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
            <input
              type="password"
              className="w-full border border-stone-300 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <div className="text-right">
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={resetBusy || busy}
              className="text-sm font-semibold text-[#c0392b] underline hover:text-[#962d22] disabled:opacity-50"
            >
              {resetBusy ? "Sending reset link…" : "Forgot password?"}
            </button>
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {info ? <p className="text-sm text-emerald-800">{info}</p> : null}
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
      </div>
    </div>
  );
}
