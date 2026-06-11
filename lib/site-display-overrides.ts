import {
  GIFT_CARD_ORDER_URL,
  LOCATIONS,
  type LocationId,
  type LocationInfo,
} from "@/lib/constants";
import type { SiteEditableCopy } from "@/lib/site-owner-config";
import { DEFAULT_EDITABLE_COPY } from "@/lib/site-owner-config";

function applyAddressLine(loc: LocationInfo, line: string): LocationInfo {
  const trimmed = line.trim();
  if (!trimmed) return loc;
  const parts = trimmed.split(",").map((s) => s.trim());
  return {
    ...loc,
    streetAddress: parts[0] ?? trimmed,
    addressLines: [trimmed],
    addressLocality: parts[1] ?? loc.addressLocality,
    addressRegion: (parts[2]?.match(/\b([A-Z]{2})\b/)?.[1] as "TX") ?? loc.addressRegion,
    postalCode: parts[2]?.match(/\b(\d{5})\b/)?.[1] ?? loc.postalCode,
  };
}

/** Paris + Sulphur `LocationInfo` — CMS → owner config → constants. */
export function mergedDisplayLocations(
  copy: SiteEditableCopy | undefined,
  cms?: Record<string, string>,
): Record<LocationId, LocationInfo> {
  let paris = { ...LOCATIONS.paris };
  let sulphur_springs = { ...LOCATIONS.sulphur_springs };

  if (cms?.footer_paris_address?.trim()) {
    paris = applyAddressLine(paris, cms.footer_paris_address);
  }
  if (cms?.footer_ss_address?.trim()) {
    sulphur_springs = applyAddressLine(sulphur_springs, cms.footer_ss_address);
  }
  if (cms?.footer_paris_phone?.trim()) paris.phonePrimary = cms.footer_paris_phone.trim();
  if (cms?.footer_massage_phone?.trim()) paris.phoneSecondary = cms.footer_massage_phone.trim();
  if (cms?.footer_ss_phone?.trim()) sulphur_springs.phonePrimary = cms.footer_ss_phone.trim();

  const parisMaps = cms?.footer_paris_maps_url?.trim();
  if (parisMaps && /^https?:\/\//i.test(parisMaps)) paris.mapsUrl = parisMaps;
  const ssMaps = cms?.footer_ss_maps_url?.trim();
  if (ssMaps && /^https?:\/\//i.test(ssMaps)) sulphur_springs.mapsUrl = ssMaps;

  if (copy?.parisChiroPhone?.trim()) paris.phonePrimary = copy.parisChiroPhone.trim();
  if (copy?.rubClubMassagePhone?.trim()) paris.phoneSecondary = copy.rubClubMassagePhone.trim();
  if (copy?.sulphurChiroPhone?.trim()) sulphur_springs.phonePrimary = copy.sulphurChiroPhone.trim();

  return { paris, sulphur_springs };
}

export function effectiveGiftCardUrl(
  copy: SiteEditableCopy | undefined,
  cms?: Record<string, string>,
): string {
  const cmsUrl = cms?.nav_giftcard_url?.trim();
  if (cmsUrl && /^https?:\/\//i.test(cmsUrl)) return cmsUrl;
  const u = copy?.giftCardOrderUrl?.trim();
  if (u && /^https?:\/\//i.test(u)) return u;
  return GIFT_CARD_ORDER_URL;
}

export type GiftCardStickyConfig = {
  enabled: boolean;
  label: string;
  href: string;
  dismissKey: string;
};

export function effectiveGiftCardSticky(
  copy: SiteEditableCopy | undefined,
  cms?: Record<string, string>,
): GiftCardStickyConfig {
  const href = effectiveGiftCardUrl(copy, cms);
  const label =
    copy?.giftCardStickyLabel?.trim() ||
    DEFAULT_EDITABLE_COPY.giftCardStickyLabel;
  const enabled = copy?.giftCardStickyEnabled !== false;
  const dismissKey = `${label.length}_${href.length}`;
  return { enabled, label, href, dismissKey };
}

export function effectiveBookUrl(cms?: Record<string, string>): string {
  const u = cms?.nav_book_url?.trim();
  if (u && (u.startsWith("/") || /^https?:\/\//i.test(u))) return u;
  return "/contact";
}
