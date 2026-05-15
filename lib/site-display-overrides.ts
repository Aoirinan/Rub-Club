import {
  GIFT_CARD_ORDER_URL,
  LOCATIONS,
  type LocationId,
  type LocationInfo,
} from "@/lib/constants";
import type { SiteEditableCopy } from "@/lib/site-owner-config";

/** Paris + Sulphur `LocationInfo` with optional phone overrides from owner config. */
export function mergedDisplayLocations(copy: SiteEditableCopy | undefined): Record<LocationId, LocationInfo> {
  const paris = { ...LOCATIONS.paris };
  const sulphur_springs = { ...LOCATIONS.sulphur_springs };
  if (copy?.parisChiroPhone?.trim()) paris.phonePrimary = copy.parisChiroPhone.trim();
  if (copy?.rubClubMassagePhone?.trim()) paris.phoneSecondary = copy.rubClubMassagePhone.trim();
  if (copy?.sulphurChiroPhone?.trim()) sulphur_springs.phonePrimary = copy.sulphurChiroPhone.trim();
  return { paris, sulphur_springs };
}

export function effectiveGiftCardUrl(copy: SiteEditableCopy | undefined): string {
  const u = copy?.giftCardOrderUrl?.trim();
  if (u && /^https?:\/\//i.test(u)) return u;
  return GIFT_CARD_ORDER_URL;
}
