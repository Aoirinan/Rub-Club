import {
  GIFT_CARD_ORDER_URL,
  LOCATIONS,
  type LocationId,
  type LocationInfo,
} from "@/lib/constants";
import type { SiteEditableCopy } from "@/lib/site-owner-config";
import { DEFAULT_EDITABLE_COPY } from "@/lib/site-owner-config";

/**
 * Split an edited address line into its parts.
 *
 * The city/state/ZIP are read from the RIGHT, so a suite or unit segment can't
 * be mistaken for the city: the last segment carries "TX 75460", the one
 * before it is the city. (Splitting from the left made
 * "3305 NE Loop 286, Suite A, Paris, TX 75460" publish "Suite A" as the city
 * in the search-engine listing.) When the tail carries no state or ZIP the
 * line is left unparsed and the constants stand, so a half-typed address can
 * never publish a wrong city.
 *
 * `streetAddress` stays the first segment: it is rendered as the visible
 * street line (Paris location heading, footer, massage page), so it must keep
 * reading exactly as it does today.
 */
function applyAddressLine(loc: LocationInfo, line: string): LocationInfo {
  const trimmed = line.trim();
  if (!trimmed) return loc;
  const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  const next: LocationInfo = {
    ...loc,
    streetAddress: parts[0] ?? trimmed,
    addressLines: [trimmed],
  };

  // Need at least "street, city, TX 75460" before trusting the split.
  const tail = parts.length >= 3 ? (parts[parts.length - 1] ?? "") : "";
  const region = tail.match(/\b([A-Z]{2})\b/)?.[1];
  const postalCode = tail.match(/\b(\d{5})\b/)?.[1];
  if (!region && !postalCode) return next;

  return {
    ...next,
    addressLocality: parts[parts.length - 2] ?? loc.addressLocality,
    addressRegion: (region as LocationInfo["addressRegion"]) ?? loc.addressRegion,
    postalCode: postalCode ?? loc.postalCode,
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
  if (cms?.footer_paris_name?.trim()) paris.name = cms.footer_paris_name.trim();
  if (cms?.footer_paris_short_name?.trim()) paris.shortName = cms.footer_paris_short_name.trim();
  if (cms?.footer_paris_fax?.trim()) paris.fax = cms.footer_paris_fax.trim();
  if (cms?.footer_ss_name?.trim()) sulphur_springs.name = cms.footer_ss_name.trim();
  if (cms?.footer_ss_short_name?.trim()) {
    sulphur_springs.shortName = cms.footer_ss_short_name.trim();
  }
  if (cms?.footer_ss_fax?.trim()) sulphur_springs.fax = cms.footer_ss_fax.trim();
  if (cms?.footer_paris_phone?.trim()) paris.phonePrimary = cms.footer_paris_phone.trim();
  if (cms?.footer_massage_phone?.trim()) paris.phoneSecondary = cms.footer_massage_phone.trim();
  if (cms?.footer_ss_phone?.trim()) sulphur_springs.phonePrimary = cms.footer_ss_phone.trim();

  const parisMaps = cms?.footer_paris_maps_url?.trim();
  if (parisMaps && /^https?:\/\//i.test(parisMaps)) paris.mapsUrl = parisMaps;
  const ssMaps = cms?.footer_ss_maps_url?.trim();
  if (ssMaps && /^https?:\/\//i.test(ssMaps)) sulphur_springs.mapsUrl = ssMaps;

  // Owner-config phone overrides win over the everyday CMS "Office info →
  // Phone" fields. Normally blank; editable under Marketing → Phone overrides
  // so a stale value can be seen and cleared instead of silently winning.
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

/**
 * "Book Now URL" (Site settings → Header links). When set, every Book Now
 * button links here; when blank, Book Now opens the call-to-book popup.
 */
export function bookNowLinkUrl(cms?: Record<string, string>): string | null {
  // Opt-in: the URL field existed (unused) for a long time, so a stored value
  // alone must not change every Book Now button from the call popup to a link.
  if (cms?.nav_book_url_enabled?.trim() !== "true") return null;
  const u = cms?.nav_book_url?.trim();
  if (u && (u.startsWith("/") || /^https?:\/\//i.test(u))) return u;
  return null;
}

export function effectiveBookUrl(cms?: Record<string, string>): string {
  const u = cms?.nav_book_url?.trim();
  if (u && (u.startsWith("/") || /^https?:\/\//i.test(u))) return u;
  return "/contact";
}
