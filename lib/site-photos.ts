/**
 * Admin-replaceable site photos.
 *
 * Every marketing photo the site ships with (the `IMAGES` map plus the Paris
 * home hero carousel) gets a CMS image field here, so a manager can swap any
 * photo — stock/generic or not — from the Website editor without a code change
 * or deploy. Values fall back to the bundled file under /public when unset.
 */

import type { ContentFieldMeta } from "@/lib/cms-registry";
import { IMAGES, PARIS_HOME_HERO_IMAGES } from "@/lib/home-images";

export type SitePhotoSpec = {
  /** Stable key used by `getSitePhotos()`. */
  key: string;
  /** CMS content field id. */
  fieldId: string;
  /** Section grouping shown in the Website editor. */
  section: string;
  /** Human label shown next to the uploader. */
  label: string;
  /** Bundled default served when no override is set. */
  defaultPath: string;
  /** Which office's Photos screen this uploader belongs on. */
  office: "paris" | "sulphur";
};

const MASSAGE = "Massage photos";
const SS_MASSAGE = "Massage photos";
const CHIRO = "Chiropractic photos";
const HERO = "Home page hero carousel";

/**
 * Only photos that actually render are listed, so no uploader here is a dead
 * end. Doctor portraits use the `doctor_*_photo` fields, massage therapist
 * portraits are uploaded per person under Massage team, and office staff
 * portraits under Site staff — those all have their own uploaders already.
 */
export const SITE_PHOTOS: readonly SitePhotoSpec[] = [
  { key: "serviceTherapeutic", fieldId: "site_photo_service_therapeutic", section: MASSAGE, label: "Therapeutic massage card", defaultPath: IMAGES.serviceTherapeutic, office: "paris" },
  { key: "serviceDeepTissue", fieldId: "site_photo_service_deep_tissue", section: MASSAGE, label: "Deep tissue massage card (also the Massage service card on the home page)", defaultPath: IMAGES.serviceDeepTissue, office: "paris" },
  { key: "serviceHotStone", fieldId: "site_photo_service_hot_stone", section: MASSAGE, label: "Hot stone massage card", defaultPath: IMAGES.serviceHotStone, office: "paris" },
  { key: "servicePrenatal", fieldId: "site_photo_service_prenatal", section: MASSAGE, label: "Prenatal massage card", defaultPath: IMAGES.servicePrenatal, office: "paris" },
  { key: "serviceSports", fieldId: "site_photo_service_sports", section: MASSAGE, label: "Sports massage card", defaultPath: IMAGES.serviceSports, office: "paris" },
  { key: "serviceSwedish", fieldId: "site_photo_service_swedish", section: MASSAGE, label: "Swedish massage card", defaultPath: IMAGES.serviceSwedish, office: "paris" },
  { key: "massagePatient", fieldId: "site_photo_massage_patient", section: MASSAGE, label: "Massage page photo (next to the intro text)", defaultPath: IMAGES.massagePatient, office: "paris" },
  { key: "massageChiroTile", fieldId: "site_photo_massage_chiro_tile", section: MASSAGE, label: "Chiropractic Care service card (home page)", defaultPath: IMAGES.massageChiroTile, office: "paris" },

  // Sulphur Springs starts from the same artwork as Paris so the page looks
  // finished on day one, but each slot is separate so the two offices can use
  // their own rooms and staff later without affecting each other.
  { key: "ssMassagePatient", fieldId: "site_photo_ss_massage_patient", section: SS_MASSAGE, label: "Massage page photo (next to the intro text)", defaultPath: IMAGES.massagePatient, office: "sulphur" },
  { key: "ssMassageTherapeutic", fieldId: "site_photo_ss_massage_therapeutic", section: SS_MASSAGE, label: "Therapeutic massage card", defaultPath: IMAGES.serviceTherapeutic, office: "sulphur" },
  { key: "ssMassageDeepTissue", fieldId: "site_photo_ss_massage_deep_tissue", section: SS_MASSAGE, label: "Deep tissue massage card", defaultPath: IMAGES.serviceDeepTissue, office: "sulphur" },
  { key: "ssMassageTriggerPoint", fieldId: "site_photo_ss_massage_trigger_point", section: SS_MASSAGE, label: "Trigger point & lymphatic card", defaultPath: IMAGES.serviceSports, office: "sulphur" },
  { key: "ssMassagePrenatal", fieldId: "site_photo_ss_massage_prenatal", section: SS_MASSAGE, label: "Prenatal massage card", defaultPath: IMAGES.servicePrenatal, office: "sulphur" },
  { key: "ssMassageSports", fieldId: "site_photo_ss_massage_sports", section: SS_MASSAGE, label: "Sports massage card", defaultPath: IMAGES.serviceSports, office: "sulphur" },
  { key: "ssMassageSwedish", fieldId: "site_photo_ss_massage_swedish", section: SS_MASSAGE, label: "Swedish massage card", defaultPath: IMAGES.serviceSwedish, office: "sulphur" },
  { key: "ssMassageHotStone", fieldId: "site_photo_ss_massage_hot_stone", section: SS_MASSAGE, label: "Hot stone massage card", defaultPath: IMAGES.serviceHotStone, office: "sulphur" },

  { key: "chiroBlade", fieldId: "site_photo_chiro_blade", section: CHIRO, label: "About page photo / \"Two practices, one address\"", defaultPath: IMAGES.chiroBlade, office: "paris" },
  { key: "chiroBg", fieldId: "site_photo_chiro_bg", section: CHIRO, label: "Chiropractic page hero photo", defaultPath: IMAGES.chiroBg, office: "paris" },

  { key: "parisHero1", fieldId: "site_photo_paris_hero_1", section: HERO, label: "Hero slide 1 (reception)", defaultPath: PARIS_HOME_HERO_IMAGES[0], office: "paris" },
  { key: "parisHero2", fieldId: "site_photo_paris_hero_2", section: HERO, label: "Hero slide 2 (waiting room)", defaultPath: PARIS_HOME_HERO_IMAGES[1], office: "paris" },
  { key: "parisHero3", fieldId: "site_photo_paris_hero_3", section: HERO, label: "Hero slide 3 (massage hallway)", defaultPath: PARIS_HOME_HERO_IMAGES[2], office: "paris" },
  { key: "parisHero4", fieldId: "site_photo_paris_hero_4", section: HERO, label: "Hero slide 4 (rehab station)", defaultPath: PARIS_HOME_HERO_IMAGES[3], office: "paris" },
] as const;

export type SitePhotos = Record<string, string>;

export const SITE_PHOTO_FIELD_IDS: readonly string[] = SITE_PHOTOS.map((p) => p.fieldId);

/** CMS registry entries so the photos appear in the Website editor. */
export function buildSitePhotoCmsRegistry(): ContentFieldMeta[] {
  return SITE_PHOTOS.map((p) => ({
    id: p.fieldId,
    pageLabel: p.office === "paris" ? ("Paris photos" as const) : ("SS photos" as const),
    sectionLabel: p.section,
    fieldLabel: p.label,
    type: "image" as const,
  }));
}

export function buildSitePhotoDefaults(): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const p of SITE_PHOTOS) defaults[p.fieldId] = p.defaultPath;
  return defaults;
}

/**
 * Resolve the bundled default map with any CMS overrides applied.
 *
 * Reading from Firestore lives in `lib/site-photos-server.ts`: this module is
 * imported by `lib/cms-registry`, so it must not reach back into `lib/cms`.
 */
export function resolveSitePhotos(cms: Record<string, string>): SitePhotos {
  const out: SitePhotos = {};
  for (const p of SITE_PHOTOS) {
    out[p.key] = cms[p.fieldId]?.trim() || p.defaultPath;
  }
  return out;
}
