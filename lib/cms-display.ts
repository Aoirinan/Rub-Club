import { cache } from "react";
import { getContentMany } from "@/lib/cms";
import { DEFAULTS } from "@/lib/cms-registry";
import {
  HEADER_BRAND_LOGO_FIELDS,
  resolveChiroHeaderLogo,
  type HeaderBrandContent,
  type HeaderBrandKey,
} from "@/lib/brand-logos";
import { reviewUrlForLocation, type LocationId, type LocationInfo } from "@/lib/constants";
import { HEADER_CHIRO_LOGO_ENABLED_FIELD } from "@/lib/nav-cms";
import { getVisualPageLayoutIfSet } from "@/lib/visual-page-layout-db";
import type { VisualPageLayout, VisualScopeId } from "@/lib/visual-page-layout";
import { getSiteOwnerConfig } from "@/lib/site-owner-config";
import { effectiveGiftCardUrl, mergedDisplayLocations } from "@/lib/site-display-overrides";
import { OFFICE_INFO_CMS_IDS } from "@/lib/office-info-cms";

import {
  DEFAULT_HEADER_LOGO_HEIGHTS,
  HEADER_LOGO_HEIGHT_FIELDS,
  headerLogoHeightsFromValues,
  parseHeaderLogoHeightPx,
} from "@/lib/header-logo-sizes";
import {
  HEADER_SHOW_TOP_PHONE_BAR_FIELD,
  parseHeaderShowTopPhoneBar,
} from "@/lib/header-top-phone-bar";

export { HEADER_SHOW_TOP_PHONE_BAR_FIELD, parseHeaderShowTopPhoneBar };

const LAYOUT_CMS_IDS = [
  HEADER_SHOW_TOP_PHONE_BAR_FIELD,
  "sticky_call_bar_paris",
  "sticky_call_bar_ss",
  "accessibility_panel_enabled",
  "footer_links_default",
  "footer_links_paris",
  "footer_links_ss",
  "header_chiro_logo",
  HEADER_CHIRO_LOGO_ENABLED_FIELD,
  "header_ss_logo",
  "header_paris_lockup_title",
  "header_paris_lockup_subtitle",
  "header_paris_logo_nav_height_px",
  "header_paris_logo_mobile_height_px",
  "header_ss_logo_nav_height_px",
  "header_ss_logo_mobile_height_px",
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
  "nav_book_url_enabled",
  "social_bar_label",
  ...OFFICE_INFO_CMS_IDS,
  "social_facebook_url",
  "social_instagram_url",
] as const;

export type LayoutCmsContent = Record<(typeof LAYOUT_CMS_IDS)[number], string>;

/** Cached per request: the layout and app/page.tsx both ask for these. */
export const getLayoutCmsContent = cache(async function getLayoutCmsContent(): Promise<LayoutCmsContent> {
  const values = await getContentMany([...LAYOUT_CMS_IDS]);
  return values as LayoutCmsContent;
});

const HEADER_BRAND_KEYS: HeaderBrandKey[] = ["chiro", "ss"];

/** Build the editable header branding (logos + lockup text) from CMS values, falling back to defaults. */
export function headerBrandContentFromCms(
  cms: Partial<Record<string, string>>,
): HeaderBrandContent {
  const logos = {} as Record<HeaderBrandKey, string>;
  for (const key of HEADER_BRAND_KEYS) {
    const logoId = HEADER_BRAND_LOGO_FIELDS[key];
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
  const logoHeights = {} as HeaderBrandContent["logoHeights"];
  for (const key of HEADER_BRAND_KEYS) {
    const fields = HEADER_LOGO_HEIGHT_FIELDS[key];
    const defaults = DEFAULT_HEADER_LOGO_HEIGHTS[key];
    const nav = parseHeaderLogoHeightPx(
      cms[fields.nav] ?? DEFAULTS[fields.nav],
      defaults.nav,
    );
    const mobile = parseHeaderLogoHeightPx(
      cms[fields.mobile] ?? DEFAULTS[fields.mobile],
      defaults.mobile,
    );
    logoHeights[key] = headerLogoHeightsFromValues(nav, mobile);
  }
  const useCustomChiroLogo =
    (cms[HEADER_CHIRO_LOGO_ENABLED_FIELD] ?? DEFAULTS[HEADER_CHIRO_LOGO_ENABLED_FIELD]) ===
    "true";
  return { logos, useCustomChiroLogo, parisLockup, logoHeights };
}

export async function getScopeVisualLayout(
  scopeId: VisualScopeId,
): Promise<VisualPageLayout | null> {
  return getVisualPageLayoutIfSet(scopeId);
}

export type { VisualPageLayout };

/** Paris + Sulphur locations with CMS → owner settings → constants merge. */
export const getDisplayLocations = cache(async function getDisplayLocations(): Promise<Record<LocationId, LocationInfo>> {
  const cms = await getLayoutCmsContent();
  try {
    const cfg = await getSiteOwnerConfig();
    return mergedDisplayLocations(cfg.editableCopy, cms);
  } catch {
    return mergedDisplayLocations(undefined, cms);
  }
});

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
