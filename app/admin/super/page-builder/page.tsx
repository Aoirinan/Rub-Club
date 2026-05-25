"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { isPageLayoutId, type PageLayoutId } from "@/lib/page-layout";
import { PageBuilder } from "@/components/admin/page-builder/PageBuilder";

function PageBuilderInner() {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const initialPageId: PageLayoutId =
    pageParam && isPageLayoutId(pageParam) ? pageParam : "massage";

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const a = getFirebaseClientAuth();
    return onAuthStateChanged(a, setUser);
  }, []);

  const getIdToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  if (!user) {
    return (
      <p className="p-8 text-sm text-slate-600">
        Sign in with a manager or owner account to use the page builder.
      </p>
    );
  }

  return <PageBuilder getIdToken={getIdToken} initialPageId={initialPageId} />;
}

export default function PageBuilderPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-600">Loading page builder…</p>}>
      <PageBuilderInner />
    </Suspense>
  );
}
