"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { PatientProfileBody } from "@/app/admin/patients/_components/PatientProfileBody";
import { staffMeetsMin, type StaffRole } from "@/lib/staff-roles";

export default function PatientProfilePage() {
  return (
    <Suspense
      fallback={<div className="px-4 py-16 text-center text-sm text-slate-600">Loading…</div>}
    >
      <PatientProfilePageContent />
    </Suspense>
  );
}

function PatientProfilePageContent() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.id === "string" ? params.id : "";
  const [auth, setAuth] = useState<Auth | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  const getIdToken = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` } });
      const data = (await res.json()) as { role?: StaffRole | null };
      if (!data.role || !staffMeetsMin(data.role, "front_desk")) {
        router.replace("/admin");
        return;
      }
      setCanEdit(staffMeetsMin(data.role, "manager"));
    });
    return () => unsub();
  }, [auth, router]);

  if (!patientId) {
    return <p className="p-8 text-sm text-slate-600">Invalid patient.</p>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <h1 className="text-xl font-semibold text-slate-900">Patient profile</h1>
          <div className="flex gap-2">
            <Link
              href="/admin/patients"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
            >
              All patients
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
            >
              Scheduler
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <PatientProfileBody patientId={patientId} getIdToken={getIdToken} isSuperadmin={canEdit} />
      </main>
    </div>
  );
}
