import type { DecodedIdToken } from "firebase-admin/auth";
import { getAuth, getFirestore } from "./firebase-admin";
import { signInPredatesClaim } from "./staff-account-claim";
import {
  normalizeStaffRole,
  normalizeStaffLocationScope,
  effectiveLocationScope,
  staffMeetsMin,
  staffCapabilities,
  type StaffRole,
  type StaffCapabilities,
  type StaffLocationScope,
} from "./staff-roles";

export type { StaffRole, StaffCapabilities, StaffLocationScope };
export { staffCapabilities, staffMeetsMin, normalizeStaffRole };

export type StaffProfile = {
  role: StaffRole;
  email?: string;
  linkedProviderId?: string;
  /** Stored location access; superadmins always behave as "both". */
  locationScope: StaffLocationScope;
  /**
   * Set when a pre-existing sign-in account was locked down for its first
   * invite: sign-ins from before this moment (ms) don't count.
   */
  signInValidAfterMs?: number;
};

function timestampMs(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (raw && typeof (raw as { toMillis?: unknown }).toMillis === "function") {
    const ms = (raw as { toMillis: () => number }).toMillis();
    return Number.isFinite(ms) ? ms : undefined;
  }
  return undefined;
}

export async function verifyBearerUid(
  authorization: string | null,
): Promise<DecodedIdToken | null> {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;
  try {
    return await getAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function getStaffProfile(uid: string): Promise<StaffProfile | null> {
  const snap = await getFirestore().collection("staff").doc(uid).get();
  if (!snap.exists) return null;
  const role = normalizeStaffRole(snap.get("role"));
  if (!role) return null;
  const email = snap.get("email");
  const linkedProviderId = snap.get("linkedProviderId");
  const signInValidAfterMs = timestampMs(snap.get("signInValidAfter"));
  return {
    role,
    email: typeof email === "string" ? email : undefined,
    linkedProviderId:
      typeof linkedProviderId === "string" && linkedProviderId.trim()
        ? linkedProviderId.trim()
        : undefined,
    locationScope: normalizeStaffLocationScope(snap.get("locationScope")),
    ...(signInValidAfterMs !== undefined ? { signInValidAfterMs } : {}),
  };
}

export async function getStaffRole(uid: string): Promise<StaffRole | null> {
  const profile = await getStaffProfile(uid);
  return profile?.role ?? null;
}

export async function requireStaff(
  authorization: string | null,
  minRole: StaffRole = "massage_therapist",
): Promise<{
  uid: string;
  email?: string;
  role: StaffRole;
  linkedProviderId?: string;
  capabilities: StaffCapabilities;
  /** Effective location access (superadmins always "both"). */
  locationScope: StaffLocationScope;
} | null> {
  const decoded = await verifyBearerUid(authorization);
  if (!decoded?.uid) return null;
  const profile = await getStaffProfile(decoded.uid);
  if (!profile) return null;
  // A session from before the account was locked down for its invite (e.g.
  // someone who registered the email first) is not this staff member's.
  if (signInPredatesClaim(decoded.auth_time, profile.signInValidAfterMs)) return null;
  if (!staffMeetsMin(profile.role, minRole)) return null;
  return {
    uid: decoded.uid,
    email: decoded.email,
    role: profile.role,
    linkedProviderId: profile.linkedProviderId,
    capabilities: staffCapabilities(profile.role),
    locationScope: effectiveLocationScope(profile.role, profile.locationScope),
  };
}
