import type { UserCredential } from "firebase/auth";

export type StaffSignInResult =
  | { ok: true; role: string; emailVerified: boolean }
  | { ok: false; reason: "no_staff_access" };

/** After Firebase sign-in, confirm the user has a staff role via /api/admin/me. */
export async function completeStaffSignIn(
  cred: UserCredential,
): Promise<StaffSignInResult> {
  const token = await cred.user.getIdToken();
  const meRes = await fetch("/api/admin/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const me = (await meRes.json()) as { role?: string | null };
  if (!me.role) {
    return { ok: false, reason: "no_staff_access" };
  }
  return {
    ok: true,
    role: me.role,
    emailVerified: cred.user.emailVerified,
  };
}
