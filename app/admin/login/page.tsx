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
    <div className="bg-[#f4f2ea]">
      <div className="mx-auto max-w-md space-y-6 px-4 py-16">
      <div className="border-t-4 border-[#0f5f5c] bg-white p-6 text-center shadow-md">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0f5f5c]">Staff Login</p>
        <h1 className="mt-2 text-2xl font-black text-[#173f3b]">Staff sign-in</h1>
        <p className="mt-2 text-sm text-stone-700">
          Use the email and password your administrator created for you.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md">
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Email</span>
          <input
            className="w-full border border-stone-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Password</span>
          <input
            type="password"
            className="w-full border border-stone-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-[#0f5f5c] py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b] disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      </div>
    </div>
  );
}
