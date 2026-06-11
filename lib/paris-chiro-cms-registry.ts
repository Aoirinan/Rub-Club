import type { ContentFieldMeta } from "@/lib/cms-registry";
import { PARIS_CHIRO_SERVICES } from "@/lib/paris-chiro-services";

export function parisChiroPageBodyId(slug: string): string {
  return `paris_chiro_page_${slug}_body`;
}

export function parisChiroPageMetaId(slug: string): string {
  return `paris_chiro_page_${slug}_meta`;
}

/** CMS registry fields for Paris chiropractic service detail pages. */
export function buildParisChiroCmsRegistry(): ContentFieldMeta[] {
  const fields: ContentFieldMeta[] = [];
  for (const s of PARIS_CHIRO_SERVICES) {
    fields.push(
      {
        id: parisChiroPageBodyId(s.slug),
        pageLabel: "Paris chiro pages",
        sectionLabel: s.title,
        fieldLabel: "Page body (## headings, - bullets, blank line between paragraphs)",
        type: "richtext",
      },
      {
        id: parisChiroPageMetaId(s.slug),
        pageLabel: "Paris chiro pages",
        sectionLabel: s.title,
        fieldLabel: "SEO meta description (also shown on the service card)",
        type: "text",
      },
    );
  }
  return fields;
}

export function buildParisChiroCmsDefaults(): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const s of PARIS_CHIRO_SERVICES) {
    defaults[parisChiroPageBodyId(s.slug)] = s.body;
    defaults[parisChiroPageMetaId(s.slug)] = s.metaDescription;
  }
  return defaults;
}
