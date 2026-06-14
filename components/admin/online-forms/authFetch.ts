import { getFirebaseClientAuth } from "@/lib/firebase-client";

/** Fetch wrapper that attaches the current staff member's Firebase ID token. */
export async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const auth = getFirebaseClientAuth();
  const user = auth?.currentUser;
  const token = user ? await user.getIdToken() : null;
  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
