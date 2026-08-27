/**
 * Photos for the Sulphur Springs massage service cards.
 *
 * The names and descriptions stay in the `ss_massage_services_list` CMS field
 * so staff keep control of the wording. Photos attach by matching the service
 * name rather than by row position, so rewording or reordering that list can't
 * leave a card showing someone else's picture. An unrecognized name simply
 * falls back to the icon the grid already draws.
 */

import type { SitePhotos } from "@/lib/site-photos";

const PHOTO_MATCHES: readonly { keyword: string; photoKey: string }[] = [
  { keyword: "deeptissue", photoKey: "ssMassageDeepTissue" },
  { keyword: "hotstone", photoKey: "ssMassageHotStone" },
  { keyword: "trigger", photoKey: "ssMassageTriggerPoint" },
  { keyword: "lymphatic", photoKey: "ssMassageTriggerPoint" },
  { keyword: "prenatal", photoKey: "ssMassagePrenatal" },
  { keyword: "sports", photoKey: "ssMassageSports" },
  { keyword: "swedish", photoKey: "ssMassageSwedish" },
  { keyword: "therapeutic", photoKey: "ssMassageTherapeutic" },
] as const;

export function ssMassagePhotoFor(name: string, photos: SitePhotos): string {
  const normalized = name.toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) return "";
  const match = PHOTO_MATCHES.find((m) => normalized.includes(m.keyword));
  return match ? (photos[match.photoKey] ?? "") : "";
}
