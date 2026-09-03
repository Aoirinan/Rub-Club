import { cache } from "react";
import { getContentMany } from "@/lib/cms";
import { resolveSiteMeta, SITE_META_CMS_DEFAULTS } from "@/lib/site-meta-cms";
import { DEFAULT_JSONLD_STRINGS, type JsonLdStrings } from "@/lib/structured-data";

/** Social profile field ids declared by the navigation CMS module (read if present). */
const SOCIAL_IDS = ["social_facebook_url", "social_instagram_url"] as const;

/**
 * Server-side: the editable JSON-LD names/descriptions (Site settings →
 * "Search & social") plus any CMS social links, with code defaults.
 */
export const getJsonLdStrings = cache(async function getJsonLdStrings(): Promise<JsonLdStrings> {
  const cms = await getContentMany([
    "site_short_name",
    "site_meta_description",
    "jsonld_chiro_name_paris",
    "jsonld_chiro_name_ss",
    "jsonld_chiro_description",
    "jsonld_massage_name",
    "jsonld_massage_description",
    ...SOCIAL_IDS,
  ]);
  const meta = resolveSiteMeta(cms);
  const pick = (id: keyof typeof SITE_META_CMS_DEFAULTS) =>
    cms[id]?.trim() || SITE_META_CMS_DEFAULTS[id];
  const social = SOCIAL_IDS.map((id) => cms[id]?.trim() ?? "").filter((u) =>
    /^https?:\/\//i.test(u),
  );
  return {
    ...DEFAULT_JSONLD_STRINGS,
    chiroNameParis: pick("jsonld_chiro_name_paris"),
    chiroNameSS: pick("jsonld_chiro_name_ss"),
    chiroDescription: pick("jsonld_chiro_description"),
    massageName: pick("jsonld_massage_name"),
    massageDescription: pick("jsonld_massage_description"),
    siteName: meta.shortName,
    siteDescription: meta.description,
    sameAs: social,
  };
});
