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
export const emailFromName = "Chiropractic Associates · The Rub Club";

/** Privacy, terms, and policy copy — chiro-led brand with massage partner named. */
export const siteLegalName =
  "Chiropractic Associates (massage therapy at The Rub Club)";

export const siteDescription =
  "Family-owned chiropractic care in Paris and Sulphur Springs, TX, with licensed massage therapy at The Rub Club in Paris. Book chiropractic, massage, or stretch online or call our offices.";

export const siteKeywords = [...SITE_SEO_KEYWORDS];

/**
 * Default Open Graph image. PNG, not SVG: Facebook, LinkedIn, iMessage and
 * Slack ignore SVG share images. Same artwork as /og/og-default.svg.
 */
export const siteOgImage = "/og/og-default.png";

/** Square brand logo for Organization JSON-LD (search engines only). */
export const siteLogoImage = "/og/logo-512.png";

/** Resolve the canonical site origin from env, fallback to placeholder. */
export function getSiteOrigin(): string {
  const origin = getPublicAppOrigin();
  if (origin === "http://localhost:3000") {
    return "https://www.chiropracticparistexas.com";
  }
  return origin;
}

/**
 * Is this request being served from the canonical domain?
 *
 * Until DNS moves, the site also answers on its *.vercel.app deploy URL while
 * every canonical/og:url points at the real domain. Search engines must not
 * index that preview copy, so pages served from any other host are marked
 * noindex. Indexing turns itself back on, with no code change, as soon as the
 * canonical domain serves the site.
 */
export function isCanonicalHost(host: string | null | undefined): boolean {
  const bare = (host ?? "").split(":")[0]!.trim().toLowerCase().replace(/^www\./, "");
  if (!bare) return true; // no Host header (build/prerender) — behave as today
  if (bare === "localhost" || bare === "127.0.0.1" || bare === "[::1]") return true;
  const canonical = new URL(getSiteOrigin()).hostname.toLowerCase().replace(/^www\./, "");
  return bare === canonical;
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
