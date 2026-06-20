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
  doctorsHeading: string;
  sectionHeading: string;
  ctaTitle: string;
  ctaBody: string;
};

/** Rub Club is linked below the hero — drop legacy trailing sentence from stored lede. */
function normalizeParisStaffHeroLede(lede: string): string {
  return lede
    .replace(/ Licensed massage therapists are listed separately at The Rub Club\.?$/i, "")
    .trim();
}

export async function getParisStaffPageContent(): Promise<ParisStaffPageContent> {
  const cms = await getContentMany([...PARIS_STAFF_PAGE_CMS_KEYS]);
  const heroLede =
    cms.paris_staff_hero_lede?.trim() || PARIS_STAFF_PAGE_DEFAULTS.heroLede;
  return {
    heroTitle: cms.paris_staff_hero_title?.trim() || PARIS_STAFF_PAGE_DEFAULTS.heroTitle,
    heroLede: normalizeParisStaffHeroLede(heroLede),
    doctorsHeading:
      cms.paris_staff_doctors_heading?.trim() || PARIS_STAFF_PAGE_DEFAULTS.doctorsHeading,
    sectionHeading:
      cms.paris_staff_section_heading?.trim() || PARIS_STAFF_PAGE_DEFAULTS.sectionHeading,
    ctaTitle: cms.paris_staff_cta_title?.trim() || PARIS_STAFF_PAGE_DEFAULTS.ctaTitle,
    ctaBody: cms.paris_staff_cta_body?.trim() || PARIS_STAFF_PAGE_DEFAULTS.ctaBody,
  };
}
