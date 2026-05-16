"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

type Me = {
  authenticated: boolean;
  role?: "admin" | "superadmin" | null;
  email?: string | null;
};

export function AdminAuthGate({
  children,
  requireSuperadmin = false,
}: {
  children: ReactNode;
  requireSuperadmin?: boolean;
}) {
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
      if (requireSuperadmin && data.role !== "superadmin") {
        router.replace("/admin");
        return;
      }
      setReady(true);
    });
    return () => unsub();
  }, [auth, router, requireSuperadmin]);

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

  if (requireSuperadmin && me.role !== "superadmin") {
    return null;
  }

  return <>{children}</>;
}
