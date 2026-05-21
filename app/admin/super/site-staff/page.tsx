"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { SiteStaffAdminSection } from "@/app/admin/super/_components/SiteStaffAdminSection";

export default function SiteStaffAdminPage() {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const a = getFirebaseClientAuth();
    setAuth(a);
    if (!a) return;
    const unsub = onAuthStateChanged(a, () => {});
    return () => unsub();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Office staff</h1>
      <p className="mt-1 text-sm text-slate-600">
        Add or remove people on the Paris and Sulphur Springs staff pages without a code deploy.
      </p>
      {banner ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
          {banner}
        </p>
      ) : null}
      <div className="mt-6">
        <SiteStaffAdminSection auth={auth} onNotify={setBanner} />
      </div>
    </main>
  );
}
