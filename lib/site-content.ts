/**
 * Site-wide brand strings — consumed by metadata, JSON-LD, navigation, emails.
 * Update these strings rather than touching individual pages.
 */

export const siteTitle =
  "The Rub Club Massage & Chiropractic Associates | Paris & Sulphur Springs, TX";

export const siteTitleTemplate =
  "%s | The Rub Club & Chiropractic Associates";

export const siteShortName = "Rub Club & Chiropractic Associates";

export const siteDescription =
  "Family-owned massage therapy and chiropractic care in Paris and Sulphur Springs, TX. Book online or call—licensed therapists, experienced doctors, weekday hours.";

export const siteKeywords = [
  "massage therapy Paris TX",
  "chiropractor Paris TX",
  "deep tissue massage",
  "prenatal massage",
  "sports massage",
  "chiropractic care Sulphur Springs TX",
  "spinal decompression",
  "The Rub Club",
  "Chiropractic Associates",
];

/** Default Open Graph image — served from /public/og/og-default.svg. */
export const siteOgImage = "/og/og-default.svg";

/** Resolve the canonical site origin from env, fallback to placeholder. */
export function getSiteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://wellnessparistx.com"
  );
}

/** Build an absolute URL from a path relative to the site root. */
export function siteUrl(path: string): string {
  const origin = getSiteOrigin();
  if (!path) return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Optional `sameAs` profiles for Organization JSON-LD (env-driven). */
export function getSocialProfiles(): string[] {
  return [
    process.env.NEXT_PUBLIC_GBP_PARIS_URL,
    process.env.NEXT_PUBLIC_GBP_SS_URL,
    process.env.NEXT_PUBLIC_FACEBOOK_URL,
    process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    process.env.NEXT_PUBLIC_YELP_URL,
  ].filter((s): s is string => typeof s === "string" && s.length > 0);
}
