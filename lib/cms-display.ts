import { getContentMany } from "@/lib/cms";
import type { LocationId, LocationInfo } from "@/lib/constants";
import { getSiteOwnerConfig } from "@/lib/site-owner-config";
import { effectiveGiftCardUrl, mergedDisplayLocations } from "@/lib/site-display-overrides";

const LAYOUT_CMS_IDS = [
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
