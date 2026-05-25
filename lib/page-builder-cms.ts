import type { ContentFieldMeta, ContentPageKey } from "@/lib/cms";
import { CONTENT_REGISTRY, getContentFieldMeta } from "@/lib/cms";
import { DOCTOR_CMS_KEYS } from "@/lib/cms-doctors";
import type { PageLayoutId } from "@/lib/page-layout";
import { isPageLayoutId } from "@/lib/page-layout";

export const HERO_BLOCK_ID = "__hero__";

export type PageBuilderLayoutCmsConfig = {
  pageLabels: ContentPageKey[];
  extraPageLabels?: ContentPageKey[];
  heroFieldIds: string[];
};

export const LAYOUT_PAGE_CMS: Record<PageLayoutId, PageBuilderLayoutCmsConfig> = {
  massage: {
    pageLabels: ["Massage"],
    heroFieldIds: ["massage_hero_heading", "massage_hero_subheading"],
  },
  chiropractic: {
    pageLabels: ["Chiropractic"],
    extraPageLabels: ["Doctors"],
    heroFieldIds: ["chiro_hero_heading", "chiro_hero_subheading"],
  },
  "sulphur-springs": {
    pageLabels: ["Sulphur Springs"],
    extraPageLabels: ["Sulphur staff"],
    heroFieldIds: ["ss_hero_heading"],
  },
};

export function layoutPageLabels(pageId: PageLayoutId): ContentPageKey[] {
  const cfg = LAYOUT_PAGE_CMS[pageId];
  return [...cfg.pageLabels, ...(cfg.extraPageLabels ?? [])];
}

export function registryFieldsForLayoutPage(pageId: PageLayoutId): ContentFieldMeta[] {
  const labels = new Set(layoutPageLabels(pageId));
  return CONTENT_REGISTRY.filter((f) => labels.has(f.pageLabel));
}

export function heroFieldIdsForLayoutPage(pageId: PageLayoutId): string[] {
  return LAYOUT_PAGE_CMS[pageId].heroFieldIds;
}

export function heroFieldsForLayoutPage(pageId: PageLayoutId): ContentFieldMeta[] {
  return heroFieldIdsForLayoutPage(pageId)
    .map((id) => getContentFieldMeta(id))
    .filter((f): f is ContentFieldMeta => Boolean(f));
}

export function fieldMetaForIds(ids: string[]): ContentFieldMeta[] {
  return ids
    .map((id) => getContentFieldMeta(id))
    .filter((f): f is ContentFieldMeta => Boolean(f));
}

/** Doctor block uses full doctor CMS keys. */
export const DOCTORS_BLOCK_FIELD_IDS: string[] = [...DOCTOR_CMS_KEYS];

export type BuilderScopeKind = "layout" | "content";

export function scopeKind(scope: string): BuilderScopeKind {
  if (scope === "faq-items") return "content";
  return isPageLayoutId(scope) ? "layout" : "content";
}
