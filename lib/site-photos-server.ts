/**
 * Firestore-backed reads for admin-replaceable site photos.
 *
 * Kept separate from `lib/site-photos` because that module is imported by
 * `lib/cms-registry`, and `lib/cms` imports the registry — pulling `lib/cms`
 * into the registry module would create an import cycle.
 */

import { getContentMany } from "@/lib/cms";
import {
  resolveSitePhotos,
  SITE_PHOTO_FIELD_IDS,
  type SitePhotos,
} from "@/lib/site-photos";

/**
 * Current photo for every replaceable slot. Pass `prefetched` when the caller
 * already loaded CMS content so we don't refetch.
 */
export async function getSitePhotos(prefetched?: Record<string, string>): Promise<SitePhotos> {
  const cms = prefetched ?? (await getContentMany([...SITE_PHOTO_FIELD_IDS]));
  return resolveSitePhotos(cms);
}
