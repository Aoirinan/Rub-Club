/** Owned SEO terms — keep in site meta; not delegated to third-party schedulers. */
export const SITE_SEO_KEYWORDS = [
  "Paris TX chiropractor",
  "Paris TX massage",
  "Sulphur Springs chiropractor",
  "Sulphur Springs massage",
  "The Rub Club",
  "chiropractic Paris Texas",
  "massage therapy Paris Texas",
  "Dr. Sean Welborn",
  "Dr. Greg Thompson",
  "Dr. Brandy Collins",
  "wellness Paris TX",
  "Chiropractic Associates",
  "deep tissue massage",
  "prenatal massage",
  "sports massage",
] as const;

export function pageKeywords(extra?: string[]): string[] {
  return extra ? [...SITE_SEO_KEYWORDS, ...extra] : [...SITE_SEO_KEYWORDS];
}
