import type { ContentFieldMeta } from "@/lib/cms";
import { SS_INJURIES, SS_PATIENT_RESOURCES, SS_SERVICES } from "@/lib/sulphur-springs-content";

export function ssPageBodyId(slug: string): string {
  return `ss_page_${slug}_body`;
}

export function ssPageMetaId(slug: string): string {
  return `ss_page_${slug}_meta`;
}

/** CMS registry fields for Sulphur Springs treatment, injury, and patient resources pages. */
export function buildSSCmsRegistry(): ContentFieldMeta[] {
  const fields: ContentFieldMeta[] = [];

  for (const s of SS_SERVICES) {
    fields.push(
      {
        id: ssPageBodyId(s.slug),
        pageLabel: "SS subpages",
        sectionLabel: s.title,
        fieldLabel: "Page body (## headings, - bullets, blank line between paragraphs)",
        type: "richtext",
      },
      {
        id: ssPageMetaId(s.slug),
        pageLabel: "SS subpages",
        sectionLabel: s.title,
        fieldLabel: "SEO meta description (optional override)",
        type: "text",
      },
    );
  }

  for (const i of SS_INJURIES) {
    fields.push(
      {
        id: ssPageBodyId(i.slug),
        pageLabel: "SS subpages",
        sectionLabel: i.title,
        fieldLabel: "Page body (## headings, - bullets, blank line between paragraphs)",
        type: "richtext",
      },
      {
        id: ssPageMetaId(i.slug),
        pageLabel: "SS subpages",
        sectionLabel: i.title,
        fieldLabel: "SEO meta description (optional override)",
        type: "text",
      },
    );
  }

  fields.push({
    id: "ss_patient_resources_intro",
    pageLabel: "SS subpages",
    sectionLabel: "Patient resources",
    fieldLabel: "Intro paragraph",
    type: "richtext",
  });

  return fields;
}

export function buildSSCmsDefaults(): Record<string, string> {
  const defaults: Record<string, string> = {
    ss_patient_resources_intro: SS_PATIENT_RESOURCES.intro,
  };

  for (const s of SS_SERVICES) {
    defaults[ssPageBodyId(s.slug)] = s.body;
    defaults[ssPageMetaId(s.slug)] = s.metaDescription;
  }
  for (const i of SS_INJURIES) {
    defaults[ssPageBodyId(i.slug)] = i.body;
    defaults[ssPageMetaId(i.slug)] = i.metaDescription;
  }
  return defaults;
}

export const SS_PAGE_SLUGS = [
  ...SS_SERVICES.map((s) => s.slug),
  ...SS_INJURIES.map((i) => i.slug),
] as const;
