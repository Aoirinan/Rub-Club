"use client";

import { useEffect, useState } from "react";
import type { Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { PracticePagesEditor } from "@/components/admin/practice-pages/PracticePagesEditor";

export default function PracticePagesAdminPage() {
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  if (!auth) {
    return <div className="px-4 py-16 text-center text-sm text-slate-600">Loading…</div>;
  }

  return (
    <PracticePagesEditor
      getIdToken={async () => (await auth.currentUser?.getIdToken()) ?? null}
    />
  );
}
