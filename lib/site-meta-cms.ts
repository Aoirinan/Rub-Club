import type { ContentFieldMeta } from "@/lib/cms-registry";
import { SITE_SEO_KEYWORDS } from "@/lib/seo-keywords";
import {
  siteDescription,
  siteShortName,
  siteTitle,
  siteTitleTemplate,
} from "@/lib/site-content";

/**
 * Site-wide search / social identity that used to live only in
 * lib/site-content.ts and lib/structured-data.ts. Edited under
 * Site settings → "Search & social". The code constants stay as fallbacks.
 */
export const SITE_META_CMS_IDS = [
  "site_meta_title",
  "site_meta_title_template",
  "site_meta_description",
  "site_meta_keywords",
  "site_short_name",
  "jsonld_chiro_name_paris",
  "jsonld_chiro_name_ss",
  "jsonld_chiro_description",
  "jsonld_massage_name",
  "jsonld_massage_description",
] as const;

export type SiteMetaCmsId = (typeof SITE_META_CMS_IDS)[number];

export const JSONLD_DEFAULTS = {
  chiroNameParis: "Chiropractic Associates",
  chiroNameSS: "Chiropractic Associates of Sulphur Springs",
  chiroDescription:
    "Family-owned chiropractic clinic offering adjustments, spinal decompression, rehab, and acupuncture in Northeast Texas.",
  massageName: "The Rub Club Massage",
  massageDescription:
    "Licensed massage therapists offering deep tissue, prenatal, and sports massage in Paris, TX.",
} as const;

const SECTION = "Search & social";

export const SITE_META_CMS_REGISTRY: ContentFieldMeta[] = [
  {
    id: "site_meta_title",
    pageLabel: "Site settings",
    sectionLabel: SECTION,
    fieldLabel: "Home page browser title (search result title)",
    type: "text",
  },
  {
    id: "site_meta_title_template",
    pageLabel: "Site settings",
    sectionLabel: SECTION,
    fieldLabel: "Browser title suffix for other pages (%s = page name)",
    type: "text",
  },
  {
    id: "site_meta_description",
    pageLabel: "Site settings",
    sectionLabel: SECTION,
    fieldLabel: "Site search description (home page + social previews)",
    type: "text",
  },
  {
    id: "site_meta_keywords",
    pageLabel: "Site settings",
    sectionLabel: SECTION,
    fieldLabel: "Search keywords (one per line)",
    type: "richtext",
  },
  {
    id: "site_short_name",
    pageLabel: "Site settings",
    sectionLabel: SECTION,
    fieldLabel: "Site name (social previews, search listings)",
    type: "text",
  },
  {
    id: "jsonld_chiro_name_paris",
    pageLabel: "Site settings",
    sectionLabel: SECTION,
    fieldLabel: "Search listing business name — Paris chiropractic",
    type: "text",
  },
  {
    id: "jsonld_chiro_name_ss",
    pageLabel: "Site settings",
    sectionLabel: SECTION,
    fieldLabel: "Search listing business name — Sulphur Springs chiropractic",
    type: "text",
  },
  {
    id: "jsonld_chiro_description",
    pageLabel: "Site settings",
    sectionLabel: SECTION,
    fieldLabel: "Search listing description — chiropractic",
    type: "text",
  },
  {
    id: "jsonld_massage_name",
    pageLabel: "Site settings",
    sectionLabel: SECTION,
    fieldLabel: "Search listing business name — massage",
    type: "text",
  },
  {
    id: "jsonld_massage_description",
    pageLabel: "Site settings",
    sectionLabel: SECTION,
    fieldLabel: "Search listing description — massage",
    type: "text",
  },
];

export const SITE_META_CMS_DEFAULTS: Record<SiteMetaCmsId, string> = {
  site_meta_title: siteTitle,
  site_meta_title_template: siteTitleTemplate,
  site_meta_description: siteDescription,
  site_meta_keywords: SITE_SEO_KEYWORDS.join("\n"),
  site_short_name: siteShortName,
  jsonld_chiro_name_paris: JSONLD_DEFAULTS.chiroNameParis,
  jsonld_chiro_name_ss: JSONLD_DEFAULTS.chiroNameSS,
  jsonld_chiro_description: JSONLD_DEFAULTS.chiroDescription,
  jsonld_massage_name: JSONLD_DEFAULTS.massageName,
  jsonld_massage_description: JSONLD_DEFAULTS.massageDescription,
};

export type SiteMeta = {
  title: string;
  titleTemplate: string;
  description: string;
  keywords: string[];
  shortName: string;
};

/** Merge CMS values over the code defaults (blank → default). */
export function resolveSiteMeta(cms: Partial<Record<string, string>>): SiteMeta {
  const pick = (id: SiteMetaCmsId) => cms[id]?.trim() || SITE_META_CMS_DEFAULTS[id];
  const keywords = pick("site_meta_keywords")
    .split(/\r?\n/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
  return {
    title: pick("site_meta_title"),
    titleTemplate: pick("site_meta_title_template"),
    description: pick("site_meta_description"),
    keywords: keywords.length > 0 ? keywords : [...SITE_SEO_KEYWORDS],
    shortName: pick("site_short_name"),
  };
}
