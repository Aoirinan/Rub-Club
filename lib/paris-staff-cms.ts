import { getContentMany } from "@/lib/cms";
import type { ContentFieldMeta } from "@/lib/cms";
import {
  PARIS_OFFICE_STAFF,
  PARIS_STAFF_PAGE_DEFAULTS,
  type ParisOfficeStaffMember,
} from "@/lib/paris-office-staff";
import { PARIS_STAFF_IMAGES } from "@/lib/paris-staff-images";

export const PARIS_STAFF_PAGE_CMS_KEYS = [
  "paris_staff_hero_title",
  "paris_staff_hero_lede",
  "paris_staff_section_heading",
  "paris_staff_cta_title",
  "paris_staff_cta_body",
] as const;

export function parisStaffSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function parisStaffBioId(name: string): string {
  return `paris_staff_${parisStaffSlug(name)}_bio`;
}

export function parisStaffPhotoId(name: string): string {
  return `paris_staff_${parisStaffSlug(name)}_photo`;
}

export function parisStaffCmsKeysForMember(name: string): { bio: string; photo: string } {
  return { bio: parisStaffBioId(name), photo: parisStaffPhotoId(name) };
}

export function allParisStaffContentIds(): string[] {
  const memberIds = PARIS_OFFICE_STAFF.flatMap((m) => {
    const keys = parisStaffCmsKeysForMember(m.name);
    return [keys.bio, keys.photo];
  });
  return [...PARIS_STAFF_PAGE_CMS_KEYS, ...memberIds];
}

export function buildParisStaffCmsRegistry(): ContentFieldMeta[] {
  const fields: ContentFieldMeta[] = [
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

  for (const member of PARIS_OFFICE_STAFF) {
    const keys = parisStaffCmsKeysForMember(member.name);
    fields.push(
      {
        id: keys.photo,
        pageLabel: "Paris staff",
        sectionLabel: member.name,
        fieldLabel: "Photo",
        type: "image",
      },
      {
        id: keys.bio,
        pageLabel: "Paris staff",
        sectionLabel: member.name,
        fieldLabel: "Bio",
        type: "richtext",
      },
    );
  }

  return fields;
}

export function buildParisStaffCmsDefaults(): Record<string, string> {
  const defaults: Record<string, string> = {
    paris_staff_hero_title: PARIS_STAFF_PAGE_DEFAULTS.heroTitle,
    paris_staff_hero_lede: PARIS_STAFF_PAGE_DEFAULTS.heroLede,
    paris_staff_section_heading: PARIS_STAFF_PAGE_DEFAULTS.sectionHeading,
    paris_staff_cta_title: PARIS_STAFF_PAGE_DEFAULTS.ctaTitle,
    paris_staff_cta_body: PARIS_STAFF_PAGE_DEFAULTS.ctaBody,
  };

  for (const member of PARIS_OFFICE_STAFF) {
    const keys = parisStaffCmsKeysForMember(member.name);
    defaults[keys.bio] = member.bio;
    defaults[keys.photo] = PARIS_STAFF_IMAGES[member.imageKey];
  }

  return defaults;
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

export async function getParisOfficeStaffForDisplay(): Promise<ParisOfficeStaffMember[]> {
  const ids = allParisStaffContentIds();
  const cms = await getContentMany(ids);

  return PARIS_OFFICE_STAFF.map((member) => {
    const keys = parisStaffCmsKeysForMember(member.name);
    const bio = cms[keys.bio]?.trim();
    const photo = cms[keys.photo]?.trim() || PARIS_STAFF_IMAGES[member.imageKey];
    return {
      ...member,
      bio: bio !== undefined && bio !== "" ? bio : member.bio,
      image: photo,
    };
  });
}
