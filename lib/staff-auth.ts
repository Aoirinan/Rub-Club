import type { DecodedIdToken } from "firebase-admin/auth";
import { getAuth, getFirestore } from "./firebase-admin";
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
};

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
  return {
    role,
    email: typeof email === "string" ? email : undefined,
    linkedProviderId:
      typeof linkedProviderId === "string" && linkedProviderId.trim()
        ? linkedProviderId.trim()
        : undefined,
    locationScope: normalizeStaffLocationScope(snap.get("locationScope")),
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
