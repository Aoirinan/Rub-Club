import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import {
  defaultBlockOrder,
  normalizeBlockOrder,
  type PageLayoutId,
} from "@/lib/page-layout";

const COLLECTION = "site_page_layouts";

export async function getPageBlockOrder(
  pageId: PageLayoutId,
  db?: Firestore,
): Promise<string[]> {
  const firestore = db ?? getFirestore();
  const snap = await firestore.collection(COLLECTION).doc(pageId).get();
  if (!snap.exists) return defaultBlockOrder(pageId);
  const data = snap.data();
  return normalizeBlockOrder(pageId, data?.blockOrder);
}

export async function savePageBlockOrder(
  pageId: PageLayoutId,
  blockOrder: string[],
  byEmail: string,
  db?: Firestore,
): Promise<string[]> {
  const firestore = db ?? getFirestore();
  const normalized = normalizeBlockOrder(pageId, blockOrder);
  await firestore.collection(COLLECTION).doc(pageId).set(
    {
      blockOrder: normalized,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: byEmail,
    },
    { merge: true },
  );
  return normalized;
}
