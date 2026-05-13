import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Password updated",
  robots: { index: false, follow: false },
};

export default function PasswordResetCompletePage() {
  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Password changed</h1>
        <p className="text-sm text-slate-600">You can now sign in with your new password.</p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Home
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Staff sign-in
          </Link>
        </div>
      </div>
    </div>
  );
}
