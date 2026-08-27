import type { ContentFieldMeta, ContentPageKey } from "@/lib/cms-registry";
import { CONTENT_REGISTRY } from "@/lib/cms-registry";
import type { PageLayoutId } from "@/lib/page-layout";
import { isPageLayoutId } from "@/lib/page-layout";

/** Content-only scopes (no public block layout). */
export type ContentScopeId =
  | "home"
  | "wellness"
  | "paris-office"
  | "paris-chiro-pages"
  | "paris-staff"
  | "ss-staff"
  | "ss-subpages"
  | "ss-massage"
  | "ss-contact"
  | "insurance"
  | "services-hub"
  | "reviews"
  | "patient-forms"
  | "about"
  | "faq-copy"
  | "contact"
  | "footer"
  | "navigation"
  | "doctors-global"
  | "photos";

export type PageBuilderScopeId = PageLayoutId | ContentScopeId | "faq-items" | "massage-team";

export function isContentScopeId(v: string): v is ContentScopeId {
  return (
    v === "home" ||
    v === "wellness" ||
    v === "paris-office" ||
    v === "paris-chiro-pages" ||
    v === "paris-staff" ||
    v === "ss-staff" ||
    v === "ss-subpages" ||
    v === "ss-massage" ||
    v === "ss-contact" ||
    v === "insurance" ||
    v === "services-hub" ||
    v === "reviews" ||
    v === "patient-forms" ||
    v === "about" ||
    v === "faq-copy" ||
    v === "contact" ||
    v === "footer" ||
    v === "navigation" ||
    v === "doctors-global" ||
    v === "photos"
  );
}

export function isFaqItemsScope(v: string): v is "faq-items" {
  return v === "faq-items";
}

export function isMassageTeamScope(v: string): v is "massage-team" {
  return v === "massage-team";
}

export function isPageBuilderScopeId(v: string): v is PageBuilderScopeId {
  return (
    isPageLayoutId(v) ||
    isContentScopeId(v) ||
    isFaqItemsScope(v) ||
    isMassageTeamScope(v)
  );
}

const CONTENT_SCOPE_PAGES: Record<ContentScopeId, ContentPageKey[]> = {
  home: ["Home"],
  wellness: ["Wellness care plans"],
  "paris-office": ["Paris / main office"],
  "paris-chiro-pages": ["Paris chiro pages"],
  "paris-staff": ["Paris staff"],
  "ss-staff": ["Sulphur staff"],
  "ss-subpages": ["SS subpages"],
  // Split out of the Sulphur Springs landing scope: both are real pages, and
  // burying their copy under "Home" made them effectively unfindable.
  "ss-massage": ["SS massage page"],
  "ss-contact": ["SS contact page"],
  insurance: ["Insurance"],
  "services-hub": ["Services hub"],
  reviews: ["Reviews"],
  "patient-forms": ["Patient forms"],
  about: ["About"],
  "faq-copy": ["FAQ"],
  contact: ["Contact"],
  footer: ["Footer"],
  navigation: ["Navigation"],
  "doctors-global": ["Doctors"],
  photos: ["Photos"],
};

export type ContentScopeSection = {
  id: string;
  label: string;
  fieldIds: string[];
};

export type ContentScopeDef = {
  id: ContentScopeId;
  label: string;
  description: string;
  sections: ContentScopeSection[];
};

function buildSectionsForPageLabels(pageLabels: ContentPageKey[]): ContentScopeSection[] {
  const fields = CONTENT_REGISTRY.filter((f) => pageLabels.includes(f.pageLabel));
  const bySection = new Map<string, ContentFieldMeta[]>();
  for (const f of fields) {
    const key = `${f.pageLabel}::${f.sectionLabel}`;
    const arr = bySection.get(key) ?? [];
    arr.push(f);
    bySection.set(key, arr);
  }
  return [...bySection.entries()].map(([key, metas]) => {
    const sectionLabel = key.split("::")[1] ?? "Section";
    return {
      id: key.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase(),
      label: sectionLabel,
      fieldIds: metas.map((m) => m.id),
    };
  });
}

/** Only ids whose label differs from the auto-generated one are listed. */
const SCOPE_LABELS: Partial<Record<ContentScopeId, string>> = {
  "faq-copy": "FAQ page copy",
  "doctors-global": "Doctors (global)",
  "ss-subpages": "Sulphur subpages",
  "ss-staff": "Sulphur staff",
  "ss-massage": "Sulphur massage page",
  "ss-contact": "Sulphur contact page",
  footer: "Header & footer",
};

function autoScopeLabel(id: ContentScopeId): string {
  return id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ");
}

export const CONTENT_SCOPES: ContentScopeDef[] = (
  Object.entries(CONTENT_SCOPE_PAGES) as [ContentScopeId, ContentPageKey[]][]
).map(([id, pageLabels]) => ({
  id,
  label: SCOPE_LABELS[id] ?? autoScopeLabel(id),
  description:
    id === "photos"
      ? "Swap any marketing photo on the site"
      : `Edit ${pageLabels.join(", ")} copy`,
  sections: buildSectionsForPageLabels(pageLabels),
}));

export function contentScopeDef(id: ContentScopeId): ContentScopeDef {
  return CONTENT_SCOPES.find((s) => s.id === id)!;
}

export function allContentScopes(): ContentScopeDef[] {
  return CONTENT_SCOPES;
}

export function sectionDef(
  scopeId: ContentScopeId,
  sectionId: string,
): ContentScopeSection | undefined {
  return contentScopeDef(scopeId).sections.find((s) => s.id === sectionId);
}
