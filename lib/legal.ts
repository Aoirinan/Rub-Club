/**
 * Public legal page paths and shared copy identifiers.
 * Have a licensed attorney review page content before production launch.
 */

export const PRIVACY_PRACTICES_PATH = "/privacy" as const;
export const WEBSITE_PRIVACY_PATH = "/website-privacy" as const;
export const TERMS_PATH = "/terms" as const;

/** Practice name as it should appear in legal pages. */
export const LEGAL_PRACTICE_NAME =
  "Chiropractic Associates (massage therapy at The Rub Club)";

/** Shown on legal pages — update when counsel approves a revision. */
export const LEGAL_EFFECTIVE_DATE = "May 18, 2026";

export const LEGAL_PAGES = [
  { path: PRIVACY_PRACTICES_PATH, label: "Privacy practices (NPP)" },
  { path: WEBSITE_PRIVACY_PATH, label: "Website privacy" },
  { path: TERMS_PATH, label: "Terms of use" },
] as const;
