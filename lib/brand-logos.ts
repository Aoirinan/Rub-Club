/** Local brand assets under /public/logos (replace chiro file when Sean sends final art). */

export const BRAND_LOGOS = {
  rubClub: "/logos/rub-club.png",
  /** Prefer .webp until a new PNG is added; update path when replacing Sean's lockup. */
  chiropractic: "/logos/chiropractic-associates.webp",
  sulphurSprings: "/images/staff-ss/ss-logo.webp",
} as const;

export type BrandLogoVariant = "home" | "massage" | "chiropractic" | "sulphur-springs";
