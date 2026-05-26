/** Local brand assets under /public/logos (replace chiro file when Sean sends final art). */

export const BRAND_LOGOS = {
  rubClub: "/logos/rub-club.png",
  /** Paris, TX lockup (user-supplied art). */
  chiropractic: "/logos/chiropractic-paris-tx.png",
  /** Spine-in-circle mark; paired with type in `SulphurSpringsLockup`. */
  sulphurSpringsIcon: "/logos/sulphur-springs-icon.webp",
} as const;

export type BrandLogoVariant = "home" | "massage" | "chiropractic" | "sulphur-springs";
