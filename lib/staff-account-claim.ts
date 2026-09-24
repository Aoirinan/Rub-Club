import { randomBytes } from "node:crypto";
import type { Auth, UserRecord } from "firebase-admin/auth";

/**
 * Sign-in methods to remove from a pre-existing account before its first staff
 * role: everything except email/password, which is reset instead.
 */
export function providersToUnlinkBeforeClaim(providerIds: readonly string[]): string[] {
  return [...new Set(providerIds.filter((id) => id && id !== "password"))];
}

/**
 * True when an ID token comes from a sign-in made before the staff record's
 * `signInValidAfter` (set when a pre-existing account was locked down for its
 * first invite). Such a token may still be inside its one-hour life.
 */
export function signInPredatesClaim(
  authTimeSec: number | undefined,
  signInValidAfterMs: number | undefined,
): boolean {
  if (signInValidAfterMs === undefined) return false;
  if (typeof authTimeSec !== "number" || !Number.isFinite(authTimeSec)) return true;
  return authTimeSec * 1000 < signInValidAfterMs;
}

/**
 * Lock down a Firebase Auth account that existed BEFORE its first staff role.
 * Anyone can register an email through the public Firebase API, so such an
 * account may belong to someone who doesn't own the mailbox. A new random
 * password (never shown to anyone), other sign-in methods removed and every
 * session revoked leave the invite / password-reset email as the only way in.
 *
 * Returns the moment (ms) from which sign-ins count. Store it on the staff
 * record as `signInValidAfter` so `requireStaff` also refuses an ID token from
 * an earlier sign-in that has not expired yet.
 */
export async function secureUnclaimedAuthAccount(auth: Auth, user: UserRecord): Promise<number> {
  const unlink = providersToUnlinkBeforeClaim(user.providerData.map((p) => p.providerId));
  await auth.updateUser(user.uid, {
    password: randomBytes(24).toString("base64url"),
    ...(unlink.length > 0 ? { providersToUnlink: unlink } : {}),
  });
  await auth.revokeRefreshTokens(user.uid);
  // Firebase's own revocation instant (whole seconds), as checkRevoked uses it.
  const updated = await auth.getUser(user.uid);
  const validAfter = updated.tokensValidAfterTime ? Date.parse(updated.tokensValidAfterTime) : NaN;
  return Number.isFinite(validAfter) ? validAfter : Date.now();
}
