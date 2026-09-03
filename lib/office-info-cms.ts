import type { ContentFieldMeta } from "@/lib/cms-registry";
import { LOCATIONS } from "@/lib/constants";

/**
 * Office identity that used to come only from lib/constants.ts: the office
 * name, the short "City, TX" label, and the fax number. Edited next to the
 * address/phone fields on each office's "Office info & hours" page and
 * applied by `mergedDisplayLocations` wherever a LocationInfo is shown.
 */
export const OFFICE_INFO_CMS_IDS = [
  "footer_paris_name",
  "footer_paris_short_name",
  "footer_paris_fax",
  "footer_ss_name",
  "footer_ss_short_name",
  "footer_ss_fax",
] as const;

export type OfficeInfoCmsId = (typeof OFFICE_INFO_CMS_IDS)[number];

export const OFFICE_INFO_CMS_REGISTRY: ContentFieldMeta[] = [
  {
    id: "footer_paris_name",
    pageLabel: "Paris / main office",
    sectionLabel: "Address & phone",
    fieldLabel: "Office name (location pages, contact page, booking form)",
    type: "text",
  },
  {
    id: "footer_paris_short_name",
    pageLabel: "Paris / main office",
    sectionLabel: "Address & phone",
    fieldLabel: "Short name (footer heading, hours subtitle, review button)",
    type: "text",
  },
  {
    id: "footer_paris_fax",
    pageLabel: "Paris / main office",
    sectionLabel: "Address & phone",
    fieldLabel: "Fax",
    type: "phone",
  },
  {
    id: "footer_ss_name",
    pageLabel: "SS / office",
    sectionLabel: "Address & phone",
    fieldLabel: "Office name (location pages, contact page, booking form)",
    type: "text",
  },
  {
    id: "footer_ss_short_name",
    pageLabel: "SS / office",
    sectionLabel: "Address & phone",
    fieldLabel: "Short name (footer heading, hours subtitle, review button)",
    type: "text",
  },
  {
    id: "footer_ss_fax",
    pageLabel: "SS / office",
    sectionLabel: "Address & phone",
    fieldLabel: "Fax",
    type: "phone",
  },
];

export const OFFICE_INFO_CMS_DEFAULTS: Record<OfficeInfoCmsId, string> = {
  footer_paris_name: LOCATIONS.paris.name,
  footer_paris_short_name: LOCATIONS.paris.shortName,
  footer_paris_fax: LOCATIONS.paris.fax ?? "",
  footer_ss_name: LOCATIONS.sulphur_springs.name,
  footer_ss_short_name: LOCATIONS.sulphur_springs.shortName,
  footer_ss_fax: LOCATIONS.sulphur_springs.fax ?? "",
};
