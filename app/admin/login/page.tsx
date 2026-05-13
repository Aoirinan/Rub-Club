"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Wrong email or password, or this account is not in this Firebase project.";
      case "auth/invalid-email":
        return "That email address does not look valid.";
      case "auth/user-disabled":
        return "This account has been disabled in Firebase.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait several minutes, then try again.";
      case "auth/operation-not-allowed":
        return "Email/password sign-in is not enabled for this Firebase project.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return `Sign-in failed (${err.code}).`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Could not sign in.";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const auth = getFirebaseClientAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/admin");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Staff sign-in</h1>
        <p className="text-sm text-slate-600">
          Use the Firebase email/password account your administrator created for you.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800">Email</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800">Password</span>
          <input
            type="password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
