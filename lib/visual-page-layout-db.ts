import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { buildDefaultVisualLayoutForScope } from "@/lib/visual-page-migrations";
import {
  normalizeVisualPageLayout,
  parseVisualPageLayout,
  type VisualPageLayout,
  type VisualScopeId,
} from "@/lib/visual-page-layout";

const COLLECTION = "site_visual_layouts";

export async function getVisualPageLayout(
  scopeId: VisualScopeId,
  db?: Firestore,
): Promise<VisualPageLayout> {
  const firestore = db ?? getFirestore();
  const snap = await firestore.collection(COLLECTION).doc(scopeId).get();
  const fallback = buildDefaultVisualLayoutForScope(scopeId);
  if (!snap.exists) return fallback;
  const data = snap.data();
  return parseVisualPageLayout(data?.layout ?? data, scopeId, fallback);
}

/** Returns null when no saved visual doc (public site uses legacy layout). */
export async function getVisualPageLayoutIfSet(
  scopeId: VisualScopeId,
  db?: Firestore,
): Promise<VisualPageLayout | null> {
  const firestore = db ?? getFirestore();
  const snap = await firestore.collection(COLLECTION).doc(scopeId).get();
  if (!snap.exists) return null;
  const fallback = buildDefaultVisualLayoutForScope(scopeId);
  const data = snap.data();
  return parseVisualPageLayout(data?.layout ?? data, scopeId, fallback);
}

export async function saveVisualPageLayout(
  scopeId: VisualScopeId,
  layout: VisualPageLayout,
  byEmail: string,
  db?: Firestore,
): Promise<VisualPageLayout> {
  const firestore = db ?? getFirestore();
  const normalized = normalizeVisualPageLayout(layout);
  await firestore.collection(COLLECTION).doc(scopeId).set(
    {
      scopeId,
      layout: normalized,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: byEmail,
    },
    { merge: true },
  );
  return normalized;
}
