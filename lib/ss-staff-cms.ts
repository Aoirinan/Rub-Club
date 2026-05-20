import { getContentMany } from "@/lib/cms";
import type { ContentFieldMeta } from "@/lib/cms";
import { SS_STAFF, type SSStaffMember } from "@/lib/sulphur-springs-content";
import { staffCmsSlug } from "@/lib/staff-cms-id";

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

export function ssStaffNameId(staffId: string): string {
  return `ss_staff_${staffCmsSlug(staffId)}_name`;
}

export function ssStaffRoleId(staffId: string): string {
  return `ss_staff_${staffCmsSlug(staffId)}_role`;
}

export function ssStaffBioId(staffId: string): string {
  return `ss_staff_${staffCmsSlug(staffId)}_bio`;
}

export function ssStaffPhotoId(staffId: string): string {
  return `ss_staff_${staffCmsSlug(staffId)}_photo`;
}

export function ssStaffCmsKeysForMember(staffId: string): {
  name: string;
  role: string;
  bio: string;
  photo: string;
} {
  return {
    name: ssStaffNameId(staffId),
    role: ssStaffRoleId(staffId),
    bio: ssStaffBioId(staffId),
    photo: ssStaffPhotoId(staffId),
  };
}

export function allSSStaffContentIds(): string[] {
  const memberIds = SS_STAFF.flatMap((m) => {
    const keys = ssStaffCmsKeysForMember(m.id);
    return [keys.name, keys.role, keys.bio, keys.photo];
  });
  return [...SS_STAFF_PAGE_CMS_KEYS, ...memberIds];
}

export function buildSSStaffCmsRegistry(): ContentFieldMeta[] {
  const fields: ContentFieldMeta[] = [
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

  for (const member of SS_STAFF) {
    const keys = ssStaffCmsKeysForMember(member.id);
    const section = member.name;
    fields.push(
      {
        id: keys.name,
        pageLabel: "Sulphur staff",
        sectionLabel: section,
        fieldLabel: "Name",
        type: "text",
      },
      {
        id: keys.role,
        pageLabel: "Sulphur staff",
        sectionLabel: section,
        fieldLabel: "Job title",
        type: "text",
      },
      {
        id: keys.photo,
        pageLabel: "Sulphur staff",
        sectionLabel: section,
        fieldLabel: "Photo",
        type: "image",
      },
      {
        id: keys.bio,
        pageLabel: "Sulphur staff",
        sectionLabel: section,
        fieldLabel: "Bio",
        type: "richtext",
      },
    );
  }

  return fields;
}

export function buildSSStaffCmsDefaults(): Record<string, string> {
  const defaults: Record<string, string> = {
    ss_staff_hero_title: SS_STAFF_PAGE_DEFAULTS.heroTitle,
    ss_staff_hero_lede: SS_STAFF_PAGE_DEFAULTS.heroLede,
    ss_staff_section_heading: SS_STAFF_PAGE_DEFAULTS.sectionHeading,
    ss_staff_cta_title: SS_STAFF_PAGE_DEFAULTS.ctaTitle,
    ss_staff_cta_body: SS_STAFF_PAGE_DEFAULTS.ctaBody,
  };

  for (const member of SS_STAFF) {
    const keys = ssStaffCmsKeysForMember(member.id);
    defaults[keys.name] = member.name;
    defaults[keys.role] = member.role;
    defaults[keys.bio] = member.bio;
    if (member.image) {
      defaults[keys.photo] = member.image.startsWith("/")
        ? member.image
        : `/${member.image.replace(/^\//, "")}`;
    }
  }

  return defaults;
}

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

export async function getSSStaffForDisplay(): Promise<SSStaffMember[]> {
  const cms = await getContentMany(allSSStaffContentIds());

  return SS_STAFF.map((member) => {
    const keys = ssStaffCmsKeysForMember(member.id);
    const name = cms[keys.name]?.trim() || member.name;
    const role = cms[keys.role]?.trim() || member.role;
    const bio = cms[keys.bio]?.trim();
    const photo = cms[keys.photo]?.trim() || member.image;
    return {
      name,
      role,
      bio: bio !== undefined && bio !== "" ? bio : member.bio,
      ...(photo ? { image: photo } : {}),
    };
  });
}
