/**
 * Site-wide brand strings — consumed by metadata, JSON-LD, navigation, emails.
 * Update these strings rather than touching individual pages.
 */

import { getPublicAppOrigin } from "./app-origin";
import { SITE_SEO_KEYWORDS } from "@/lib/seo-keywords";

export const siteTitle =
  "Chiropractic Associates | Paris & Sulphur Springs, TX — Massage at The Rub Club";

export const siteTitleTemplate = "%s | Chiropractic Associates";

export const siteShortName = "Chiropractic Associates";

/** SendGrid / transactional email "From" display name. */
export const emailFromName = siteShortName;

/** Privacy, terms, and policy copy — chiro-led brand with massage partner named. */
export const siteLegalName =
  "Chiropractic Associates (massage therapy at The Rub Club)";

export const siteDescription =
  "Family-owned chiropractic care in Paris and Sulphur Springs, TX, with licensed massage therapy at The Rub Club in Paris. Book chiropractic, massage, or stretch online or call our offices.";

export const siteKeywords = [...SITE_SEO_KEYWORDS];

/** Default Open Graph image — served from /public/og/og-default.svg. */
export const siteOgImage = "/og/og-default.svg";

/** Resolve the canonical site origin from env, fallback to placeholder. */
export function getSiteOrigin(): string {
  const origin = getPublicAppOrigin();
  if (origin === "http://localhost:3000") {
    return "https://wellnessparistx.com";
  }
  return origin;
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
