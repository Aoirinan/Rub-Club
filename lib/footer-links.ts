/**
 * CMS-editable footer "Explore" link lists, one list per business context.
 * Stored in site_content as one link per line: `Label — /path` (em dash, or a
 * spaced hyphen / en dash / pipe), matching the registry's existing
 * "one per line" field conventions.
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
Sulphur Springs about us — /sulphur-springs/staff
About us — /about
${SHARED_LINK_LINES}
Contact — /contact`;

export const FOOTER_LINKS_PARIS_TEXT = `Chiropractic care — /services/chiropractic
Wellness care plans — /services/chiropractic/wellness-care-plans
About us — Paris office — /locations/paris/staff
Office & hours — /locations/paris
${SHARED_LINK_LINES}
Contact — /contact`;

export const FOOTER_LINKS_SS_TEXT = `Home — /sulphur-springs
About us — /sulphur-springs/staff
About chiropractic — /sulphur-springs/patient-resources
Q & A — /sulphur-springs/q-and-a
Insurance & billing — /sulphur-springs/insurance
Patient forms — /sulphur-springs/patient-forms
Patient reviews — /sulphur-springs/reviews
Privacy practices — /privacy
Website privacy — /website-privacy
Terms of use — /terms
Contact — /sulphur-springs/contact`;

const CONTEXT_DEFAULTS: Record<SiteBusinessContext, string> = {
  default: FOOTER_LINKS_DEFAULT_TEXT,
  paris_chiro: FOOTER_LINKS_PARIS_TEXT,
  sulphur_springs: FOOTER_LINKS_SS_TEXT,
};

/**
 * Fallback separators for lines typed without an em dash. Each must be
 * surrounded by spaces so a hyphenated label or slug ("Q & A", "/q-and-a")
 * is never split. The em dash is handled first, exactly as before, so every
 * previously saved line keeps parsing identically.
 */
const ALT_SEPARATORS = [" – ", " | ", " - "] as const;

/** Split at the rightmost fallback separator, mirroring the em-dash rule. */
function splitOnAltSeparator(line: string): [string, string] | null {
  let bestIdx = -1;
  let bestLen = 0;
  for (const sep of ALT_SEPARATORS) {
    const idx = line.lastIndexOf(sep);
    if (idx > bestIdx || (idx === bestIdx && sep.length > bestLen)) {
      if (idx !== -1) {
        bestIdx = idx;
        bestLen = sep.length;
      }
    }
  }
  if (bestIdx === -1) return null;
  return [line.slice(0, bestIdx), line.slice(bestIdx + bestLen)];
}

/**
 * Parse "Label — /path" lines. An em dash is the documented separator; a
 * spaced hyphen, en dash, or pipe also works. Lines with no separator are
 * skipped.
 */
export function parseFooterLinks(raw: string | undefined | null): FooterLink[] {
  if (!raw?.trim()) return [];
  const links: FooterLink[] = [];
  for (const line of raw.split("\n")) {
    let parts: [string, string] | null = null;
    const emIdx = line.lastIndexOf("—");
    if (emIdx !== -1) {
      parts = [line.slice(0, emIdx), line.slice(emIdx + 1)];
    } else {
      parts = splitOnAltSeparator(line);
    }
    if (!parts) continue;
    const label = parts[0].trim();
    const href = parts[1].trim();
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
