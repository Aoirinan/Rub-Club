/**
 * Self-hosted marketing images (migrated from the practices' legacy
 * cdcssl.ibsrv.net / Baystone CDN — see scripts/download-ibsrv-assets.mjs).
 * All files live under /public; no external image host dependency remains.
 */

export const IMAGES = {
  rubClubLogo: "/logos/rub-club.webp",
  /** Legacy chiro wordmark — prefer `BRAND_LOGOS.chiropractic` in `BrandLogoStrip`. Unused in UI. */
  chiroLogo: "/images/legacy/chiro-logo-legacy.webp",
  massageHeroBanner: "/images/legacy/massage-hero-banner.webp",
  massagePatient: "/images/legacy/massage-patient.webp",
  serviceDeepTissue: "/images/legacy/service-deep-tissue.webp",
  servicePrenatal: "/images/legacy/service-prenatal.webp",
  serviceSports: "/images/legacy/service-sports.webp",
  massageChiroTile: "/images/legacy/massage-chiro-tile.webp",
  chiroBlade: "/images/legacy/chiro-blade.webp",
  chiroBg: "/images/legacy/chiro-bg.webp",
  doctorGreg: "/images/legacy/doctor-greg-thompson.webp",
  doctorSean: "/images/legacy/doctor-sean-welborn.webp",
  doctorCollins: "/images/legacy/doctor-brandy-collins.webp",
  staffAna: "/images/legacy/staff-ana.webp",
  staffShely: "/images/legacy/staff-shely.webp",
  staffRosylin: "/images/legacy/staff-rosylin.webp",
  staffChannety: "/images/legacy/staff-channety.webp",
  staffBrandi: "/images/legacy/staff-brandi.webp",
} as const;

/** Paris homepage hero carousel — real office photos (treatment room, hallway, rehab, waiting room). */
export const PARIS_HOME_HERO_IMAGES = [
  "/images/paris-home/hero-1-treatment-room.webp",
  "/images/paris-home/hero-2-hallway.webp",
  "/images/paris-home/hero-3-rehab-station.webp",
  "/images/paris-home/hero-4-waiting-room.webp",
] as const;
