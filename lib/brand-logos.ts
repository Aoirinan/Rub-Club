/** Local brand assets under /public/logos. */

export const BRAND_LOGOS = {
  /** Paris, TX lockup — wide header variant built from clinic-approved art. */
  chiropractic: "/logos/chiropractic-associates-wide.png",
  /** Original circular lockup (source for `npm run build:chiro-logo`). */
  chiropracticSource: "/logos/chiropractic-associates.png",
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
};
