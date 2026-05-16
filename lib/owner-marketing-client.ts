"use client";

import { getFirebaseClientAuth } from "@/lib/firebase-client";

/** Calls owner marketing APIs with Firebase staff token when signed in. */
export async function ownerMarketingFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const auth = getFirebaseClientAuth();
  const user = auth?.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  }
  return fetch(input, { ...init, credentials: "include", headers });
}
