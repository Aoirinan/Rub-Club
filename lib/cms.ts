import { cache } from "react";
import { getFirestore } from "@/lib/firebase-admin";
import { DEFAULTS } from "@/lib/cms-registry";

export * from "@/lib/cms-registry";

export type SiteContentDoc = {
  id: string;
  pageLabel: string;
  sectionLabel: string;
  fieldLabel: string;
  type: import("@/lib/cms-registry").ContentFieldType;
  value: string;
  updatedAt?: { toDate?: () => Date };
  updatedBy?: string;
};

export const SITE_CONTENT_COLLECTION = "site_content";

/**
 * Cache tag for stored site content. Routes that write to `site_content` call
 * `revalidateTag(SITE_CONTENT_TAG)` alongside their `revalidatePath` calls.
 *
 * Note: values are deliberately NOT held in a cross-request data cache. They
 * are re-read once per render instead, so a manager's save is live on the very
 * next request and a stale snapshot can never mask an edit.
 */
export const SITE_CONTENT_TAG = "site-content";

/**
 * Read every saved field in one query.
 *
 * The collection only holds fields a manager has actually edited (a few dozen
 * documents, ~10 KB); the ~900 registry ids that were never touched simply fall
 * back to `DEFAULTS`. One collection read is therefore far cheaper than the
 * hundreds of per-id `doc.get()` calls a page used to make — most of which were
 * misses.
 */
async function readStoredSiteContent(): Promise<Record<string, string>> {
  const snap = await getFirestore().collection(SITE_CONTENT_COLLECTION).get();
  const out: Record<string, string> = {};
  for (const doc of snap.docs) {
    const value = doc.get("value");
    if (typeof value === "string") out[doc.id] = value;
  }
  return out;
}

/**
 * Last snapshot that was read successfully. If Firestore hiccups mid-render we
 * reuse it rather than blanking every manager-edited field back to its code
 * default, which is what a bare `catch → {}` would do.
 */
let lastGoodSnapshot: Record<string, string> | null = null;

/** One read per render (React `cache`), shared by every field lookup. */
const storedSiteContent = cache(async function storedSiteContent(): Promise<
  Record<string, string>
> {
  try {
    const stored = await readStoredSiteContent();
    lastGoodSnapshot = stored;
    return stored;
  } catch {
    return lastGoodSnapshot ?? {};
  }
});

/** A stored value always wins; an unsaved (or non-string) field uses the default. */
function resolveContentValue(stored: Record<string, string>, id: string): string {
  const value = stored[id];
  if (typeof value === "string") return value;
  return DEFAULTS[id] ?? "";
}

export async function getContent(id: string): Promise<string> {
  return resolveContentValue(await storedSiteContent(), id);
}

export async function getContentMany(ids: string[]): Promise<Record<string, string>> {
  const stored = await storedSiteContent();
  return Object.fromEntries(ids.map((id) => [id, resolveContentValue(stored, id)]));
}

/**
 * Bypasses every cache — for admin write paths that must compare against the
 * value currently in Firestore (e.g. the change log's "before" snapshot).
 */
export async function getContentUncached(id: string): Promise<string> {
  try {
    const snap = await getFirestore().collection(SITE_CONTENT_COLLECTION).doc(id).get();
    if (!snap.exists) return DEFAULTS[id] ?? "";
    const value = snap.data()?.value;
    return typeof value === "string" ? value : (DEFAULTS[id] ?? "");
  } catch {
    return DEFAULTS[id] ?? "";
  }
}
export const CONTENT_CHANGE_LOG_COLLECTION = "content_change_log";

/** Paths revalidated when site content is saved in superadmin. */
export const CMS_REVALIDATE_PATHS = [
  "/",
  "/about",
  "/faq",
  "/contact",
  "/services",
  "/services/chiropractic",
  "/services/chiropractic/stretch-and-flex-rehab",
  "/services/chiropractic/wellness-care-plans",
  "/services/massage",
  "/services/massage/prices",
  "/sulphur-springs",
  "/sulphur-springs/massage",
  "/sulphur-springs/insurance",
  "/sulphur-springs/reviews",
  "/sulphur-springs/patient-forms",
  "/insurance",
  "/reviews",
  "/patient-forms",
  "/locations/paris",
  "/locations/paris/staff",
] as const;
