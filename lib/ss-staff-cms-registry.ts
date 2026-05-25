import type { ContentFieldMeta } from "@/lib/cms-registry";

export const SS_STAFF_PAGE_CMS_KEYS = [
  "ss_staff_hero_title",
  "ss_staff_hero_lede",
  "ss_staff_section_heading",
  "ss_staff_cta_title",
  "ss_staff_cta_body",
] as const;

export const SS_STAFF_PAGE_DEFAULTS = {
  heroTitle: "Meet the Sulphur Springs Team",
  heroLede: "",
  sectionHeading: "Our Team",
  ctaTitle: "Ready for relief?",
  ctaBody:
    "Book an appointment online or give us a call — we're here to help you feel better and move better.",
} as const;

export function buildSSStaffCmsRegistry(): ContentFieldMeta[] {
  return [
    {
      id: "ss_staff_hero_title",
      pageLabel: "Sulphur staff",
      sectionLabel: "Page hero",
      fieldLabel: "Main heading",
      type: "text",
    },
    {
      id: "ss_staff_hero_lede",
      pageLabel: "Sulphur staff",
      sectionLabel: "Page hero",
      fieldLabel: "Intro paragraph (optional)",
      type: "richtext",
    },
    {
      id: "ss_staff_section_heading",
      pageLabel: "Sulphur staff",
      sectionLabel: "Team grid",
      fieldLabel: "Section heading",
      type: "text",
    },
    {
      id: "ss_staff_cta_title",
      pageLabel: "Sulphur staff",
      sectionLabel: "Bottom CTA",
      fieldLabel: "CTA title",
      type: "text",
    },
    {
      id: "ss_staff_cta_body",
      pageLabel: "Sulphur staff",
      sectionLabel: "Bottom CTA",
      fieldLabel: "CTA body",
      type: "text",
    },
  ];
}

export function buildSSStaffCmsDefaults(): Record<string, string> {
  return {
    ss_staff_hero_title: SS_STAFF_PAGE_DEFAULTS.heroTitle,
    ss_staff_hero_lede: SS_STAFF_PAGE_DEFAULTS.heroLede,
    ss_staff_section_heading: SS_STAFF_PAGE_DEFAULTS.sectionHeading,
    ss_staff_cta_title: SS_STAFF_PAGE_DEFAULTS.ctaTitle,
    ss_staff_cta_body: SS_STAFF_PAGE_DEFAULTS.ctaBody,
  };
}
