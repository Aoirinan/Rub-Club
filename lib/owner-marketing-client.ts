"use client";

import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

async function resolveStaffIdToken(): Promise<string | null> {
  const auth = getFirebaseClientAuth();
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser.getIdToken();
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) {
        resolve(null);
        return;
      }
      resolve(await user.getIdToken());
    });
  });
}

/** Calls owner marketing APIs with Firebase staff token when signed in. */
export async function ownerMarketingFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = await resolveStaffIdToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  }
  return fetch(input, { ...init, credentials: "include", headers });
}
