"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged, type Auth, type User } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { PageBuilder } from "@/components/admin/page-builder/PageBuilder";

function PageBuilderInner() {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const scopeParam = searchParams.get("scope");
  const initialScope = scopeParam ?? pageParam ?? "massage";

  const [user, setUser] = useState<User | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    const a = getFirebaseClientAuth();
    setAuth(a);
    return onAuthStateChanged(a, setUser);
  }, []);

  const getIdToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  if (!user) {
    return (
      <p className="p-8 text-sm text-slate-600">
        Sign in with a manager or owner account to use the website editor.
      </p>
    );
  }

  return (
    <PageBuilder getIdToken={getIdToken} auth={auth} initialScope={initialScope} />
  );
}

export default function PageBuilderPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-600">Loading website editor…</p>}>
      <PageBuilderInner />
    </Suspense>
  );
}
