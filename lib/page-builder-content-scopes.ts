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
  | "paris-header"
  | "paris-photos"
  | "ss-staff"
  | "ss-subpages"
  | "ss-conditions"
  | "ss-resources"
  | "ss-wellness"
  | "ss-prices"
  | "ss-doctors"
  | "ss-office"
  | "ss-massage"
  | "ss-contact"
  | "ss-insurance"
  | "ss-reviews"
  | "ss-patient-forms"
  | "ss-header"
  | "ss-photos"
  | "insurance"
  | "reviews"
  | "patient-forms"
  | "about"
  | "faq-copy"
  | "contact"
  | "doctors-global"
  | "site-settings"
  | "navigation"
  | "site-text"
  | "massage-landing"
  | "booking-page";

export type PageBuilderScopeId =
  | PageLayoutId
  | ContentScopeId
  | "faq-items"
  | "ss-faq-items"
  | "massage-team";

const CONTENT_SCOPE_IDS: ReadonlySet<string> = new Set<ContentScopeId>([
  "home",
  "wellness",
  "paris-office",
  "paris-chiro-pages",
  "paris-staff",
  "paris-header",
  "paris-photos",
  "ss-staff",
  "ss-subpages",
  "ss-conditions",
  "ss-resources",
  "ss-wellness",
  "ss-prices",
  "ss-doctors",
  "ss-office",
  "ss-massage",
  "ss-contact",
  "ss-insurance",
  "ss-reviews",
  "ss-patient-forms",
  "ss-header",
  "ss-photos",
  "insurance",
  "reviews",
  "patient-forms",
  "about",
  "faq-copy",
  "contact",
  "doctors-global",
  "site-settings",
  "navigation",
  "site-text",
  "massage-landing",
  "booking-page",
]);

export function isContentScopeId(v: string): v is ContentScopeId {
  return CONTENT_SCOPE_IDS.has(v);
}

export function isFaqItemsScope(v: string): v is "faq-items" | "ss-faq-items" {
  return v === "faq-items" || v === "ss-faq-items";
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
  "paris-chiro-pages": ["Paris chiro pages", "Services hub"],
  "paris-staff": ["Paris staff"],
  "paris-header": ["Paris header & footer"],
  "paris-photos": ["Paris photos"],
  "ss-staff": ["Sulphur staff"],
  "ss-subpages": ["SS subpages"],
  "ss-conditions": ["SS conditions"],
  "ss-resources": ["SS patient resources"],
  "ss-wellness": ["SS wellness"],
  "ss-prices": ["SS prices"],
  "ss-doctors": ["SS doctors"],
  "ss-office": ["SS / office"],
  "ss-massage": ["SS massage page"],
  "ss-contact": ["SS contact page"],
  "ss-insurance": ["SS insurance"],
  "ss-reviews": ["SS reviews"],
  "ss-patient-forms": ["SS patient forms"],
  "ss-header": ["SS header & footer"],
  "ss-photos": ["SS photos"],
  insurance: ["Insurance"],
  reviews: ["Reviews"],
  "patient-forms": ["Patient forms"],
  about: ["About"],
  "faq-copy": ["FAQ"],
  contact: ["Contact"],
  "doctors-global": ["Doctors"],
  "site-settings": ["Site settings"],
  navigation: ["Navigation"],
  "site-text": ["Site text"],
  "massage-landing": ["Massage landing"],
  "booking-page": ["Booking page"],
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
  "doctors-global": "Doctors",
  "ss-subpages": "Services",
  "ss-conditions": "Conditions",
  "ss-resources": "Patient resources",
  "ss-staff": "Staff",
  "ss-massage": "Massage page",
  "ss-contact": "Contact",
  "ss-wellness": "Wellness Plan",
  "ss-prices": "Prices",
  "ss-doctors": "Doctors",
  "ss-office": "Office info",
  "paris-header": "Header & footer",
  "ss-header": "Header & footer",
  "paris-photos": "Photos",
  "ss-photos": "Photos",
  "site-settings": "Site settings",
  navigation: "Menu & navigation",
  "site-text": "Site text (buttons & labels)",
  "massage-landing": "Massage landing page",
  "booking-page": "Book page",
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
    id === "paris-photos" || id === "ss-photos"
      ? "Swap marketing photos for this office"
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

/** Scopes that list one page at a time via a third dropdown. */
export const PAGE_PICKER_SCOPES: ReadonlySet<PageBuilderScopeId> = new Set([
  "paris-chiro-pages",
  "ss-subpages",
  "ss-conditions",
]);
