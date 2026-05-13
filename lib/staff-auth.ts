import type { DecodedIdToken } from "firebase-admin/auth";
import { getAuth, getFirestore } from "./firebase-admin";

export type StaffRole = "admin" | "superadmin";

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

export async function getStaffRole(uid: string): Promise<StaffRole | null> {
  const snap = await getFirestore().collection("staff").doc(uid).get();
  if (!snap.exists) return null;
  const role = snap.get("role") as StaffRole | undefined;
  if (role === "admin" || role === "superadmin") return role;
  return null;
}

export async function requireStaff(
  authorization: string | null,
  minRole: "admin" | "superadmin" = "admin",
): Promise<{ uid: string; email?: string; role: StaffRole } | null> {
  const decoded = await verifyBearerUid(authorization);
  if (!decoded?.uid) return null;
  const role = await getStaffRole(decoded.uid);
  if (!role) return null;
  if (minRole === "superadmin" && role !== "superadmin") return null;
  return {
    uid: decoded.uid,
    email: decoded.email,
    role,
  };
}
