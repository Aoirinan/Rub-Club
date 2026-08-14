/**
 * Therapeutic Massage services (CURSOR_PROMPT §5b / §6a).
 *
 * Single source of truth for the massage modalities that:
 *   - appear under the "Therapeutic Massage" nav dropdown (§5b), and
 *   - render as clickable cards in the massage page "Services we offer" grid (§6a),
 * each linking to its verbatim legacy page at /services/massage/<slug> (§5).
 *
 * Order matches the legacy chiropracticparistexas.com Services menu, then the
 * remaining Rub Club modalities.
 */
import { IMAGES } from "@/lib/home-images";
import type { SitePhotos } from "@/lib/site-photos";

export type MassageServicePage = {
  slug: string;
  name: string;
  blurb: string;
  imageUrl: string;
  /** Key into the admin-replaceable site photo map. */
  photoKey: string;
};

export const MASSAGE_SERVICE_PAGES: readonly MassageServicePage[] = [
  {
    slug: "therapeutic-massage",
    name: "What is Therapeutic Massage?",
    blurb: "Coordinated with your chiropractic plan to support recovery between adjustments.",
    imageUrl: IMAGES.serviceTherapeutic,
    photoKey: "serviceTherapeutic",
  },
  {
    slug: "deep-tissue-massage",
    name: "Deep Tissue Massage",
    blurb: "Slow, targeted pressure to release chronic tension in the neck, shoulders, back, and hips.",
    imageUrl: IMAGES.serviceDeepTissue,
    photoKey: "serviceDeepTissue",
  },
  {
    slug: "hot-stone-massage",
    name: "Hot Stone Massage",
    blurb: "Heated stones paired with hands-on work to warm tight muscles and release deep tension.",
    imageUrl: IMAGES.serviceHotStone,
    photoKey: "serviceHotStone",
  },
  {
    slug: "prenatal-massage",
    name: "Prenatal Massage",
    blurb: "Pregnancy-safe positioning and techniques to ease swelling, hip pressure, and tension.",
    imageUrl: IMAGES.servicePrenatal,
    photoKey: "servicePrenatal",
  },
  {
    slug: "sports-massage",
    name: "Sports Massage",
    blurb: "Pre- and post-event work focused on recovery, range of motion, and getting you back to training.",
    imageUrl: IMAGES.serviceSports,
    photoKey: "serviceSports",
  },
  {
    slug: "swedish-massage",
    name: "Swedish Massage",
    blurb: "Long, flowing strokes that relax muscles, boost circulation, and melt away everyday stress.",
    imageUrl: IMAGES.serviceSwedish,
    photoKey: "serviceSwedish",
  },
];

/** Modality cards with admin-replaced photos applied. */
export function massageServicePagesWithPhotos(photos: SitePhotos): MassageServicePage[] {
  return MASSAGE_SERVICE_PAGES.map((s) => ({
    ...s,
    imageUrl: photos[s.photoKey] ?? s.imageUrl,
  }));
}

/** Nav children for the "Therapeutic Massage" mega-menu group (§5b). */
export function buildMassageServiceNavChildren(): {
  href: string;
  label: string;
  group: string;
}[] {
  return MASSAGE_SERVICE_PAGES.map((s) => ({
    href: `/services/massage/${s.slug}`,
    label: s.name,
    group: "Therapeutic Massage",
  }));
}
