"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type Auth, type User } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { staffMeetsMin, type StaffRole } from "@/lib/staff-roles";
import { EmailVerificationBanner } from "@/app/admin/_components/EmailVerificationBanner";

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
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        router.replace("/admin/login");
        return;
      }
      setUser(firebaseUser);
      const token = await firebaseUser.getIdToken();
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
      <div className="mx-auto max-w-lg space-y-3 px-4 py-16 text-center text-sm text-slate-700">
        <p>Your account is signed in but not yet granted staff access.</p>
        <p>
          <Link href="/admin/setup" className="font-semibold text-[#c0392b] underline">
            First-time owner? Run setup
          </Link>
        </p>
        <p className="text-slate-600">
          If you were invited as staff, ask your manager to re-send your invite, then sign in at{" "}
          <Link href="/admin/login" className="font-semibold underline">
            staff login
          </Link>
          .
        </p>
      </div>
    );
  }

  if (minRole && !staffMeetsMin(me.role, minRole)) {
    return null;
  }

  return (
    <>
      {user ? <EmailVerificationBanner user={user} /> : null}
      {children}
    </>
  );
}
