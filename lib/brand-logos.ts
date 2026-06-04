/** Local brand assets under /public/logos. */

export const BRAND_LOGOS = {
  rubClub: "/logos/rub-club.png",
  /** Paris, TX Chiropractic Associates lockup (clinic-approved). */
  chiropractic: "/logos/chiropractic-associates.png",
  /** Spine-in-circle mark; paired with type in `SulphurSpringsLockup`. */
  sulphurSpringsIcon: "/logos/sulphur-springs-icon.webp",
} as const;

export type BrandLogoVariant = "home" | "massage" | "chiropractic" | "sulphur-springs";
