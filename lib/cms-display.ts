import { getContentMany } from "@/lib/cms";
import { reviewUrlForLocation, type LocationId, type LocationInfo } from "@/lib/constants";
import {
  HEADER_BRANDING_FIELD_IDS,
  parseHeaderBrandingLayout,
  type HeaderBrandingLayout,
} from "@/lib/header-branding-cms";
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
  "footer_tagline",
  "footer_paris_address",
  "footer_paris_phone",
  "footer_massage_phone",
  "footer_ss_address",
  "footer_ss_phone",
  "footer_copyright",
  "nav_giftcard_url",
  "nav_book_url",
] as const;

export type LayoutCmsContent = Record<(typeof LAYOUT_CMS_IDS)[number], string>;

export async function getLayoutCmsContent(): Promise<LayoutCmsContent> {
  const values = await getContentMany([...LAYOUT_CMS_IDS]);
  return values as LayoutCmsContent;
}

export async function getHeaderBrandingLayout(): Promise<HeaderBrandingLayout> {
  const values = await getContentMany([...HEADER_BRANDING_FIELD_IDS]);
  return parseHeaderBrandingLayout(values);
}

export async function getScopeVisualLayout(
  scopeId: VisualScopeId,
): Promise<VisualPageLayout | null> {
  return getVisualPageLayoutIfSet(scopeId);
}

export type { HeaderBrandingLayout };
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
