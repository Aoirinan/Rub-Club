/**
 * Default Paris office-staff portraits, self-hosted under /public
 * (migrated from the legacy Baystone CDN — see scripts/download-ibsrv-assets.mjs).
 * Superadmins can replace via Website editor → Paris staff (office staff roster).
 */

export const PARIS_STAFF_IMAGES = {
  brandiBoren: "/images/legacy/paris-staff-brandi-boren.webp",
  sarahBrown: "/images/legacy/paris-staff-sarah-brown.webp",
  shaunaClark: "/images/legacy/paris-staff-shauna-clark.webp",
  shelbieGuthrie: "/images/legacy/paris-staff-shelbie-guthrie.webp",
  ashlieJenkins: "/images/legacy/paris-staff-ashlie-jenkins.webp",
  channetyWooten: "/images/legacy/paris-staff-channety-wooten.webp",
} as const;

export type ParisStaffImageKey = keyof typeof PARIS_STAFF_IMAGES;
