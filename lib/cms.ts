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

export async function getContent(id: string): Promise<string> {
  try {
    const snap = await getFirestore().collection("site_content").doc(id).get();
    if (snap.exists) {
      const v = snap.data()?.value;
      return (typeof v === "string" ? v : DEFAULTS[id]) || "";
    }
    return DEFAULTS[id] ?? "";
  } catch {
    return DEFAULTS[id] ?? "";
  }
}

export async function getContentMany(ids: string[]): Promise<Record<string, string>> {
  try {
    const snaps = await Promise.all(
      ids.map((id) => getFirestore().collection("site_content").doc(id).get()),
    );
    return Object.fromEntries(
      snaps.map((snap, i) => {
        const id = ids[i]!;
        if (snap.exists) {
          const v = snap.data()?.value;
          return [id, (typeof v === "string" ? v : DEFAULTS[id]) || ""];
        }
        return [id, DEFAULTS[id] ?? ""];
      }),
    );
  } catch {
    return Object.fromEntries(ids.map((id) => [id, DEFAULTS[id] ?? ""]));
  }
}

export const SITE_CONTENT_COLLECTION = "site_content";
export const CONTENT_CHANGE_LOG_COLLECTION = "content_change_log";

/** Paths revalidated when site content is saved in superadmin. */
export const CMS_REVALIDATE_PATHS = [
  "/",
  "/about",
  "/faq",
  "/contact",
  "/services",
  "/services/chiropractic",
  "/services/chiropractic/wellness-care-plans",
  "/services/massage",
  "/services/massage/prices",
  "/sulphur-springs",
  "/sulphur-springs/massage",
  "/insurance",
  "/reviews",
  "/patient-forms",
  "/locations/paris",
  "/locations/paris/staff",
] as const;
