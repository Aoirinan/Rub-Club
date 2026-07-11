"use client";

import { useState } from "react";
import { sendEmailVerification, type User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getPublicAppOriginForBrowser } from "@/lib/app-origin";

function verificationErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "auth/too-many-requests") {
      return "Too many verification emails sent. Wait a few minutes, then try again.";
    }
    return "Could not send verification email. Try again later.";
  }
  return "Could not send verification email.";
}

export function EmailVerificationBanner({ user }: { user: User }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (user.emailVerified) return null;

  async function onResend() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const origin = getPublicAppOriginForBrowser();
      await sendEmailVerification(user, {
        url: `${origin}/admin/login`,
        handleCodeInApp: false,
      });
      setMessage("Verification email sent. Check your inbox and spam folder.");
    } catch (err) {
      setError(verificationErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong>Verify your email.</strong> Check your inbox for a verification link.
        </p>
        <button
          type="button"
          onClick={onResend}
          disabled={busy}
          className="shrink-0 rounded border border-amber-400 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-950 hover:bg-amber-100 disabled:opacity-50"
        >
          {busy ? "Sending…" : "Resend verification"}
        </button>
      </div>
      {message ? <p className="mx-auto mt-2 max-w-6xl text-xs text-emerald-800">{message}</p> : null}
      {error ? <p className="mx-auto mt-2 max-w-6xl text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
