import { getContentMany } from "@/lib/cms";
import { PARIS_STAFF_PAGE_CMS_KEYS } from "@/lib/paris-staff-cms-registry";
import { PARIS_STAFF_PAGE_DEFAULTS } from "@/lib/paris-office-staff";

export {
  PARIS_STAFF_PAGE_CMS_KEYS,
  buildParisStaffCmsDefaults,
  buildParisStaffCmsRegistry,
} from "@/lib/paris-staff-cms-registry";

export type ParisStaffPageContent = {
  heroTitle: string;
  heroLede: string;
  sectionHeading: string;
  ctaTitle: string;
  ctaBody: string;
};

export async function getParisStaffPageContent(): Promise<ParisStaffPageContent> {
  const cms = await getContentMany([...PARIS_STAFF_PAGE_CMS_KEYS]);
  return {
    heroTitle: cms.paris_staff_hero_title?.trim() || PARIS_STAFF_PAGE_DEFAULTS.heroTitle,
    heroLede: cms.paris_staff_hero_lede?.trim() || PARIS_STAFF_PAGE_DEFAULTS.heroLede,
    sectionHeading:
      cms.paris_staff_section_heading?.trim() || PARIS_STAFF_PAGE_DEFAULTS.sectionHeading,
    ctaTitle: cms.paris_staff_cta_title?.trim() || PARIS_STAFF_PAGE_DEFAULTS.ctaTitle,
    ctaBody: cms.paris_staff_cta_body?.trim() || PARIS_STAFF_PAGE_DEFAULTS.ctaBody,
  };
}
