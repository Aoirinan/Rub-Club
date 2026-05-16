"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { staffMeetsMin, type StaffRole } from "@/lib/staff-roles";

type Me = {
  authenticated: boolean;
  role?: StaffRole | null;
  email?: string | null;
  capabilities?: {
    operations: boolean;
    siteContent: boolean;
    marketing: boolean;
    deskWrite: boolean;
  };
};

export function AdminAuthGate({
  children,
  requireMinRole,
  /** @deprecated Use requireMinRole="superadmin" */
  requireSuperadmin = false,
}: {
  children: ReactNode;
  requireMinRole?: StaffRole;
  requireSuperadmin?: boolean;
}) {
  const minRole: StaffRole | undefined = requireMinRole ?? (requireSuperadmin ? "superadmin" : undefined);
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

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
      if (!data.role) {
        setReady(true);
        return;
      }
      if (minRole && !staffMeetsMin(data.role, minRole)) {
        router.replace("/admin");
        return;
      }
      setReady(true);
    });
    return () => unsub();
  }, [auth, router, minRole]);

  if (!ready) {
    return (
      <div className="px-4 py-16 text-center text-sm text-slate-600">Checking permissions…</div>
    );
  }

  if (!me?.role) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-slate-700">
        Your account is signed in but not yet granted staff access.
      </div>
    );
  }

  if (minRole && !staffMeetsMin(me.role, minRole)) {
    return null;
  }

  return <>{children}</>;
}
