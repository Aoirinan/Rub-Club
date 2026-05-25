import { getContentMany } from "@/lib/cms";
import {
  SS_STAFF_PAGE_CMS_KEYS,
  SS_STAFF_PAGE_DEFAULTS,
} from "@/lib/ss-staff-cms-registry";

export {
  SS_STAFF_PAGE_CMS_KEYS,
  SS_STAFF_PAGE_DEFAULTS,
  buildSSStaffCmsDefaults,
  buildSSStaffCmsRegistry,
} from "@/lib/ss-staff-cms-registry";

export type SSStaffPageContent = {
  heroTitle: string;
  heroLede: string;
  sectionHeading: string;
  ctaTitle: string;
  ctaBody: string;
};

export async function getSSStaffPageContent(): Promise<SSStaffPageContent> {
  const cms = await getContentMany([...SS_STAFF_PAGE_CMS_KEYS]);
  return {
    heroTitle: cms.ss_staff_hero_title?.trim() || SS_STAFF_PAGE_DEFAULTS.heroTitle,
    heroLede: cms.ss_staff_hero_lede?.trim() || SS_STAFF_PAGE_DEFAULTS.heroLede,
    sectionHeading:
      cms.ss_staff_section_heading?.trim() || SS_STAFF_PAGE_DEFAULTS.sectionHeading,
    ctaTitle: cms.ss_staff_cta_title?.trim() || SS_STAFF_PAGE_DEFAULTS.ctaTitle,
    ctaBody: cms.ss_staff_cta_body?.trim() || SS_STAFF_PAGE_DEFAULTS.ctaBody,
  };
}
