import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { hashPatientPortalToken } from "./patient-portal-token";

export async function findBookingByPortalToken(
  db: Firestore,
  token: string,
): Promise<DocumentSnapshot | null> {
  const trimmed = token.trim();
  if (trimmed.length < 16) return null;
  const h = hashPatientPortalToken(trimmed);
  const q = await db.collection("bookings").where("patientPortalTokenHash", "==", h).limit(2).get();
  if (q.empty) return null;
  if (q.size > 1) {
    console.error("[patient-portal] multiple bookings for same token hash");
    return null;
  }
  return q.docs[0] ?? null;
}
