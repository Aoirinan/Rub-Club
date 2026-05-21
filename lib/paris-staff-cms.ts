import { getContentMany } from "@/lib/cms";
import type { ContentFieldMeta } from "@/lib/cms";
import { PARIS_STAFF_PAGE_DEFAULTS } from "@/lib/paris-office-staff";

export const PARIS_STAFF_PAGE_CMS_KEYS = [
  "paris_staff_hero_title",
  "paris_staff_hero_lede",
  "paris_staff_section_heading",
  "paris_staff_cta_title",
  "paris_staff_cta_body",
] as const;

export function buildParisStaffCmsRegistry(): ContentFieldMeta[] {
  return [
    {
      id: "paris_staff_hero_title",
      pageLabel: "Paris staff",
      sectionLabel: "Page hero",
      fieldLabel: "Main heading",
      type: "text",
    },
    {
      id: "paris_staff_hero_lede",
      pageLabel: "Paris staff",
      sectionLabel: "Page hero",
      fieldLabel: "Intro paragraph",
      type: "richtext",
    },
    {
      id: "paris_staff_section_heading",
      pageLabel: "Paris staff",
      sectionLabel: "Team grid",
      fieldLabel: "Section heading",
      type: "text",
    },
    {
      id: "paris_staff_cta_title",
      pageLabel: "Paris staff",
      sectionLabel: "Bottom CTA",
      fieldLabel: "CTA title",
      type: "text",
    },
    {
      id: "paris_staff_cta_body",
      pageLabel: "Paris staff",
      sectionLabel: "Bottom CTA",
      fieldLabel: "CTA body",
      type: "richtext",
    },
  ];
}

export function buildParisStaffCmsDefaults(): Record<string, string> {
  return {
    paris_staff_hero_title: PARIS_STAFF_PAGE_DEFAULTS.heroTitle,
    paris_staff_hero_lede: PARIS_STAFF_PAGE_DEFAULTS.heroLede,
    paris_staff_section_heading: PARIS_STAFF_PAGE_DEFAULTS.sectionHeading,
    paris_staff_cta_title: PARIS_STAFF_PAGE_DEFAULTS.ctaTitle,
    paris_staff_cta_body: PARIS_STAFF_PAGE_DEFAULTS.ctaBody,
  };
}

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
