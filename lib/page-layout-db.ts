import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import {
  defaultPageLayout,
  normalizePageLayout,
  visibleBlockOrder,
  type PageLayoutId,
  type PageLayoutState,
} from "@/lib/page-layout";

const COLLECTION = "site_page_layouts";

export async function getPageLayout(
  pageId: PageLayoutId,
  db?: Firestore,
): Promise<PageLayoutState> {
  const firestore = db ?? getFirestore();
  const snap = await firestore.collection(COLLECTION).doc(pageId).get();
  if (!snap.exists) return defaultPageLayout(pageId);
  const data = snap.data();
  return normalizePageLayout(pageId, {
    blockOrder: data?.blockOrder,
    hiddenBlocks: data?.hiddenBlocks,
  });
}

/** Visible blocks only (public site). */
export async function getPageBlockOrder(
  pageId: PageLayoutId,
  db?: Firestore,
): Promise<string[]> {
  const layout = await getPageLayout(pageId, db);
  return visibleBlockOrder(layout);
}

export async function savePageLayout(
  pageId: PageLayoutId,
  layout: PageLayoutState,
  byEmail: string,
  db?: Firestore,
): Promise<PageLayoutState> {
  const firestore = db ?? getFirestore();
  const normalized = normalizePageLayout(pageId, layout);
  await firestore.collection(COLLECTION).doc(pageId).set(
    {
      blockOrder: normalized.blockOrder,
      hiddenBlocks: normalized.hiddenBlocks,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: byEmail,
    },
    { merge: true },
  );
  return normalized;
}

/** @deprecated Use savePageLayout */
export async function savePageBlockOrder(
  pageId: PageLayoutId,
  blockOrder: string[],
  byEmail: string,
  db?: Firestore,
): Promise<string[]> {
  const existing = await getPageLayout(pageId, db);
  const hiddenBlocks = existing.hiddenBlocks.filter((id) => blockOrder.includes(id));
  const saved = await savePageLayout(
    pageId,
    { blockOrder, hiddenBlocks },
    byEmail,
    db,
  );
  return saved.blockOrder;
}
