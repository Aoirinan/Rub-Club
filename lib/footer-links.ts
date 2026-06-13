/**
 * CMS-editable footer "Explore" link lists, one list per business context.
 * Stored in site_content as one link per line: `Label — /path` (em dash),
 * matching the registry's existing "one per line" field conventions.
 */

import type { SiteBusinessContext } from "@/lib/site-business-context";

export const FOOTER_LINKS_FIELDS: Record<SiteBusinessContext, string> = {
  default: "footer_links_default",
  paris_chiro: "footer_links_paris",
  sulphur_springs: "footer_links_ss",
};

export type FooterLink = { label: string; href: string; external: boolean };

// Shared links (no Contact — that one is location-specific, appended per list).
const SHARED_LINK_LINES = `FAQ — /faq
Insurance & billing — /insurance
Patient forms — /patient-forms
Patient reviews — /reviews
Privacy practices — /privacy
Website privacy — /website-privacy
Terms of use — /terms`;

export const FOOTER_LINKS_DEFAULT_TEXT = `Massage therapy — /services/massage
Chiropractic care — /services/chiropractic
Chiropractic wellness care plans — /services/chiropractic/wellness-care-plans
Paris office — /locations/paris
Sulphur Springs office — /locations/sulphur-springs
Sulphur Springs services — /sulphur-springs
Sulphur Springs staff — /sulphur-springs/staff
About us — /about
${SHARED_LINK_LINES}
Contact — /contact`;

export const FOOTER_LINKS_PARIS_TEXT = `Chiropractic care — /services/chiropractic
Wellness care plans — /services/chiropractic/wellness-care-plans
Meet the staff — /locations/paris/staff
Office & hours — /locations/paris
${SHARED_LINK_LINES}
Contact — /contact`;

export const FOOTER_LINKS_SS_TEXT = `Home — /sulphur-springs
Meet the staff — /sulphur-springs/staff
About chiropractic — /sulphur-springs/patient-resources
Q & A — /sulphur-springs/q-and-a
${SHARED_LINK_LINES}
Contact — /sulphur-springs/contact`;

const CONTEXT_DEFAULTS: Record<SiteBusinessContext, string> = {
  default: FOOTER_LINKS_DEFAULT_TEXT,
  paris_chiro: FOOTER_LINKS_PARIS_TEXT,
  sulphur_springs: FOOTER_LINKS_SS_TEXT,
};

/** Parse "Label — /path" lines; lines without the separator are skipped. */
export function parseFooterLinks(raw: string | undefined | null): FooterLink[] {
  if (!raw?.trim()) return [];
  const links: FooterLink[] = [];
  for (const line of raw.split("\n")) {
    const idx = line.lastIndexOf("—");
    if (idx === -1) continue;
    const label = line.slice(0, idx).trim();
    const href = line.slice(idx + 1).trim();
    if (!label || !href) continue;
    links.push({ label, href, external: /^https?:\/\//i.test(href) });
  }
  return links;
}

/** Links for a context: CMS value if it parses to at least one link, else seeded defaults. */
export function footerLinksForContext(
  context: SiteBusinessContext,
  cmsValue: string | undefined | null,
): FooterLink[] {
  const fromCms = parseFooterLinks(cmsValue);
  if (fromCms.length > 0) return fromCms;
  return parseFooterLinks(CONTEXT_DEFAULTS[context]);
}
