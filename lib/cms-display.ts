import { getContentMany } from "@/lib/cms";
import { DEFAULTS } from "@/lib/cms-registry";
import {
  HEADER_BRAND_LABEL_FIELDS,
  HEADER_BRAND_LOGO_FIELDS,
  resolveChiroHeaderLogo,
  type HeaderBrandContent,
  type HeaderBrandKey,
} from "@/lib/brand-logos";
import { reviewUrlForLocation, type LocationId, type LocationInfo } from "@/lib/constants";
import { getVisualPageLayoutIfSet } from "@/lib/visual-page-layout-db";
import type { VisualPageLayout, VisualScopeId } from "@/lib/visual-page-layout";
import { getSiteOwnerConfig } from "@/lib/site-owner-config";
import { effectiveGiftCardUrl, mergedDisplayLocations } from "@/lib/site-display-overrides";

import {
  HEADER_SHOW_TOP_PHONE_BAR_FIELD,
  parseHeaderShowTopPhoneBar,
} from "@/lib/header-top-phone-bar";

export { HEADER_SHOW_TOP_PHONE_BAR_FIELD, parseHeaderShowTopPhoneBar };

const LAYOUT_CMS_IDS = [
  HEADER_SHOW_TOP_PHONE_BAR_FIELD,
  "header_chiro_label",
  "header_ss_label",
  "header_chiro_logo",
  "header_ss_logo",
  "header_paris_lockup_title",
  "header_paris_lockup_subtitle",
  "footer_tagline",
  "footer_paris_address",
  "footer_paris_phone",
  "footer_massage_phone",
  "footer_paris_maps_url",
  "footer_ss_address",
  "footer_ss_phone",
  "footer_ss_maps_url",
  "footer_copyright",
  "nav_giftcard_url",
  "nav_book_url",
] as const;

export type LayoutCmsContent = Record<(typeof LAYOUT_CMS_IDS)[number], string>;

export async function getLayoutCmsContent(): Promise<LayoutCmsContent> {
  const values = await getContentMany([...LAYOUT_CMS_IDS]);
  return values as LayoutCmsContent;
}

const HEADER_BRAND_KEYS: HeaderBrandKey[] = ["chiro", "ss"];

/** Build the editable header branding (labels + logos) from CMS values, falling back to defaults. */
export function headerBrandContentFromCms(
  cms: Partial<Record<string, string>>,
): HeaderBrandContent {
  const labels = {} as Record<HeaderBrandKey, string>;
  const logos = {} as Record<HeaderBrandKey, string>;
  for (const key of HEADER_BRAND_KEYS) {
    const labelId = HEADER_BRAND_LABEL_FIELDS[key];
    const logoId = HEADER_BRAND_LOGO_FIELDS[key];
    const labelValue = cms[labelId]?.trim();
    labels[key] = labelValue && labelValue.length > 0 ? labelValue : (DEFAULTS[labelId] ?? "");
    const logoValue = cms[logoId]?.trim();
    // Logos may legitimately default to empty (Sulphur Springs uses its lockup).
    const rawLogo = logoValue && logoValue.length > 0 ? logoValue : (DEFAULTS[logoId] ?? "");
    logos[key] = key === "chiro" ? resolveChiroHeaderLogo(rawLogo) : rawLogo;
  }
  const parisLockup = {
    title:
      cms.header_paris_lockup_title?.trim() || DEFAULTS.header_paris_lockup_title || "",
    subtitle:
      cms.header_paris_lockup_subtitle?.trim() ||
      DEFAULTS.header_paris_lockup_subtitle ||
      "",
  };
  return { labels, logos, parisLockup };
}

export async function getScopeVisualLayout(
  scopeId: VisualScopeId,
): Promise<VisualPageLayout | null> {
  return getVisualPageLayoutIfSet(scopeId);
}

export type { VisualPageLayout };

/** Paris + Sulphur locations with CMS → owner settings → constants merge. */
export async function getDisplayLocations(): Promise<Record<LocationId, LocationInfo>> {
  const cms = await getLayoutCmsContent();
  try {
    const cfg = await getSiteOwnerConfig();
    return mergedDisplayLocations(cfg.editableCopy, cms);
  } catch {
    return mergedDisplayLocations(undefined, cms);
  }
}

export async function getPublicGiftCardUrl(): Promise<string> {
  const cms = await getLayoutCmsContent();
  try {
    const cfg = await getSiteOwnerConfig();
    return effectiveGiftCardUrl(cfg.editableCopy, cms);
  } catch {
    return effectiveGiftCardUrl(undefined, cms);
  }
}

export async function getReviewUrlForLocation(id: LocationId): Promise<string> {
  try {
    const cfg = await getSiteOwnerConfig();
    return reviewUrlForLocation(id, cfg.editableCopy);
  } catch {
    return reviewUrlForLocation(id);
  }
}
