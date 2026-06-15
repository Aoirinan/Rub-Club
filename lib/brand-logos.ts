import type { HeaderLogoHeights } from "@/lib/header-logo-sizes";

/** Local brand assets under /public/logos. */

export const BRAND_LOGOS = {
  /** Paris, TX lockup — wide header variant built from clinic-approved art. */
  chiropractic: "/logos/chiropractic-associates-wide.png",
  /** Original circular lockup (source for `npm run build:chiro-logo`). */
  chiropracticSource: "/logos/chiropractic-associates.png",
  /** Circular mark with white flooded to transparency (header lockup display). */
  chiropracticMark: "/logos/chiropractic-associates-transparent.png",
  /** Spine-in-circle mark; paired with type in `SulphurSpringsLockup`. */
  sulphurSpringsIcon: "/logos/sulphur-springs-icon.webp",
} as const;

/** Intrinsic pixels of `chiropractic-associates-wide.png` (for Next/Image). */
export const CHIRO_LOGO_DIMENSIONS = { width: 1100, height: 380 } as const;

/** Prefer the wide header lockup when CMS or defaults still point at the circular source file. */
export function resolveChiroHeaderLogo(src?: string): string {
  const trimmed = src?.trim() ?? "";
  if (!trimmed) return BRAND_LOGOS.chiropractic;
  if (
    trimmed === BRAND_LOGOS.chiropracticSource ||
    trimmed.endsWith("/chiropractic-associates.png") ||
    trimmed.endsWith("chiropractic-associates.png")
  ) {
    return BRAND_LOGOS.chiropractic;
  }
  return trimmed;
}

/**
 * True when the CMS chiro logo is unset or one of the bundled defaults —
 * in that case the header renders the icon + text ParisLockup instead of a flat image.
 */
export function isDefaultChiroLogo(src?: string): boolean {
  const trimmed = src?.trim() ?? "";
  if (!trimmed) return true;
  return (
    trimmed === BRAND_LOGOS.chiropractic ||
    trimmed === BRAND_LOGOS.chiropracticSource ||
    trimmed.endsWith("chiropractic-associates.png") ||
    trimmed.endsWith("chiropractic-associates-wide.png")
  );
}

export type BrandLogoVariant = "home" | "massage" | "chiropractic" | "sulphur-springs";

export type HeaderBrandKey = "chiro" | "ss";

/** CMS field ids for editable header labels (text under each logo). */
export const HEADER_BRAND_LABEL_FIELDS: Record<HeaderBrandKey, string> = {
  chiro: "header_chiro_label",
  ss: "header_ss_label",
};

/** CMS field ids for editable header logo images. */
export const HEADER_BRAND_LOGO_FIELDS: Record<HeaderBrandKey, string> = {
  chiro: "header_chiro_logo",
  ss: "header_ss_logo",
};

/**
 * Manager-editable header branding pulled from the CMS.
 * `logos.ss` may be an empty string, meaning "render the icon + text lockup".
 */
export type HeaderBrandContent = {
  labels: Record<HeaderBrandKey, string>;
  logos: Record<HeaderBrandKey, string>;
  /** Text lines rendered next to the Paris circular mark (icon + text lockup). */
  parisLockup: { title: string; subtitle: string };
  /** Editable logo heights per brand (Footer → Header in site editor). */
  logoHeights: Record<HeaderBrandKey, HeaderLogoHeights>;
};
