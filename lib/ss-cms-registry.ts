import type { ContentFieldMeta } from "@/lib/cms-registry";
import {
  SS_INJURIES,
  SS_PATIENT_RESOURCES,
  SS_RESOURCE_ARTICLES,
  SS_SERVICES,
} from "@/lib/sulphur-springs-content";

export function ssPageBodyId(slug: string): string {
  return `ss_page_${slug}_body`;
}

export function ssPageMetaId(slug: string): string {
  return `ss_page_${slug}_meta`;
}

export function ssPageCardBlurbId(slug: string): string {
  return `ss_page_${slug}_card_blurb`;
}

export function ssPageCardImageId(slug: string): string {
  return `ss_page_${slug}_card_image`;
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
      {
        id: ssPageCardBlurbId(s.slug),
        pageLabel: "SS subpages",
        sectionLabel: s.title,
        fieldLabel: "Services grid card blurb (optional; falls back to meta description)",
        type: "text",
      },
      {
        id: ssPageCardImageId(s.slug),
        pageLabel: "SS subpages",
        sectionLabel: s.title,
        fieldLabel: "Services grid card image (optional)",
        type: "image",
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
      {
        id: ssPageCardBlurbId(i.slug),
        pageLabel: "SS subpages",
        sectionLabel: i.title,
        fieldLabel: "Services grid card blurb (optional; falls back to meta description)",
        type: "text",
      },
      {
        id: ssPageCardImageId(i.slug),
        pageLabel: "SS subpages",
        sectionLabel: i.title,
        fieldLabel: "Services grid card image (optional)",
        type: "image",
      },
    );
  }

  for (const a of SS_RESOURCE_ARTICLES) {
    fields.push(
      {
        id: ssPageBodyId(a.slug),
        pageLabel: "SS subpages",
        sectionLabel: a.title,
        fieldLabel: "Page body (## headings, - bullets, blank line between paragraphs)",
        type: "richtext",
      },
      {
        id: ssPageMetaId(a.slug),
        pageLabel: "SS subpages",
        sectionLabel: a.title,
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
    defaults[ssPageCardBlurbId(s.slug)] = "";
    defaults[ssPageCardImageId(s.slug)] = "";
  }
  for (const i of SS_INJURIES) {
    defaults[ssPageBodyId(i.slug)] = i.body;
    defaults[ssPageMetaId(i.slug)] = i.metaDescription;
    defaults[ssPageCardBlurbId(i.slug)] = "";
    defaults[ssPageCardImageId(i.slug)] = "";
  }
  for (const a of SS_RESOURCE_ARTICLES) {
    defaults[ssPageBodyId(a.slug)] = a.body;
    defaults[ssPageMetaId(a.slug)] = a.metaDescription;
  }
  return defaults;
}

export const SS_PAGE_SLUGS = [
  ...SS_SERVICES.map((s) => s.slug),
  ...SS_INJURIES.map((i) => i.slug),
  ...SS_RESOURCE_ARTICLES.map((a) => a.slug),
] as const;
