import { cache } from "react";
import { getContentMany } from "@/lib/cms";
import { getLayoutCmsContent } from "@/lib/cms-display";
import type { LocationId, LocationInfo } from "@/lib/constants";
import { OFFICE_INFO_CMS_IDS } from "@/lib/office-info-cms";
import { getSiteOwnerConfig } from "@/lib/site-owner-config";
import { bookNowLinkUrl, mergedDisplayLocations } from "@/lib/site-display-overrides";

export type DisplayChrome = {
  locations: Record<LocationId, LocationInfo>;
  /** "Book Now URL" when set, else null (Book Now opens the call popup). */
  bookUrl: string | null;
  /** Raw layout + office-info CMS values, for callers that need more fields. */
  cms: Record<string, string>;
};

/**
 * Server-side: the CMS-resolved office details (address, phones, maps link,
 * name, short name, fax) plus the Book Now link, cached per request.
 */
export const getDisplayChrome = cache(async function getDisplayChrome(): Promise<DisplayChrome> {
  const [layoutCms, officeCms] = await Promise.all([
    getLayoutCmsContent(),
    getContentMany([...OFFICE_INFO_CMS_IDS]),
  ]);
  const cms: Record<string, string> = { ...layoutCms, ...officeCms };
  let locations = mergedDisplayLocations(undefined, cms);
  try {
    const cfg = await getSiteOwnerConfig();
    locations = mergedDisplayLocations(cfg.editableCopy, cms);
  } catch {
    // Owner config unavailable: CMS + constants only.
  }
  return { locations, bookUrl: bookNowLinkUrl(cms), cms };
});

/** Convenience: just the two offices with every override applied. */
export async function getDisplayLocationsFull(): Promise<Record<LocationId, LocationInfo>> {
  return (await getDisplayChrome()).locations;
}
