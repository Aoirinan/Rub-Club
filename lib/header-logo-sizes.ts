import type { HeaderBrandKey } from "@/lib/brand-logos";

/** CMS field ids for editable header logo heights (Footer → Header in site editor). */
export const HEADER_LOGO_HEIGHT_FIELDS: Record<
  HeaderBrandKey,
  { nav: string; mobile: string }
> = {
  chiro: {
    nav: "header_paris_logo_nav_height_px",
    mobile: "header_paris_logo_mobile_height_px",
  },
  ss: {
    nav: "header_ss_logo_nav_height_px",
    mobile: "header_ss_logo_mobile_height_px",
  },
};

/** All CMS field ids for logo height — hide numeric inputs when using the visual editor. */
export const ALL_HEADER_LOGO_HEIGHT_FIELD_IDS: string[] = Object.values(
  HEADER_LOGO_HEIGHT_FIELDS,
).flatMap(({ nav, mobile }) => [nav, mobile]);

export type HeaderLogoHeights = {
  /** Desktop nav center (large slot, not scrolled). */
  nav: number;
  /** Desktop nav center after scroll shrink (~70% of nav). */
  navCompact: number;
  /** Mobile logo row and emphasized non-center header. */
  mobile: number;
};

/** Defaults bumped ~50% larger (still editable in the branding editor). */
export const DEFAULT_HEADER_LOGO_HEIGHTS: Record<HeaderBrandKey, HeaderLogoHeights> = {
  chiro: { nav: 144, navCompact: 101, mobile: 108 },
  ss: { nav: 108, navCompact: 76, mobile: 84 },
};

const MIN_LOGO_HEIGHT_PX = 24;
// Raised so the larger defaults still have room to grow when editing.
const MAX_LOGO_HEIGHT_PX = 240;

export const HEADER_LOGO_HEIGHT_MIN_PX = MIN_LOGO_HEIGHT_PX;
export const HEADER_LOGO_HEIGHT_MAX_PX = MAX_LOGO_HEIGHT_PX;

export function parseHeaderLogoHeightPx(
  raw: string | undefined,
  fallback: number,
): number {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return fallback;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_LOGO_HEIGHT_PX, Math.max(MIN_LOGO_HEIGHT_PX, n));
}

export function headerLogoHeightsFromValues(
  navPx: number,
  mobilePx: number,
): HeaderLogoHeights {
  return {
    nav: navPx,
    navCompact: Math.round(navPx * 0.7),
    mobile: mobilePx,
  };
}

export type HeaderLogoSlot = "nav" | "navCompact" | "mobile" | "side";

/** Resolve a height for a specific header logo placement. */
export function headerLogoHeightPx(
  heights: HeaderLogoHeights,
  slot: HeaderLogoSlot,
): number {
  if (slot === "nav") return heights.nav;
  if (slot === "navCompact") return heights.navCompact;
  if (slot === "mobile") return heights.mobile;
  return Math.round(heights.mobile * 0.56);
}
