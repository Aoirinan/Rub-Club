import type { ContentFieldMeta } from "@/lib/cms-registry";
import { PARIS_CHIRO_SERVICES } from "@/lib/paris-chiro-services";

export const STRETCH_FLEX_SLUG = "stretch-and-flex-rehab";

export const STRETCH_FLEX_IMAGES = {
  hero: "/images/legacy/stretch-flex-rehab-logo.webp",
  gallery1: "/images/legacy/stretch-flex-gallery-1.webp",
  gallery2: "/images/legacy/stretch-flex-gallery-2.webp",
  gallery3: "/images/legacy/stretch-flex-gallery-3.webp",
} as const;

/** Slugs that have optional hero + gallery CMS images on the detail page. */
export const PARIS_CHIRO_PAGES_WITH_IMAGES = [STRETCH_FLEX_SLUG] as const;

export function parisChiroPageBodyId(slug: string): string {
  return `paris_chiro_page_${slug}_body`;
}

export function parisChiroPageMetaId(slug: string): string {
  return `paris_chiro_page_${slug}_meta`;
}

export function parisChiroPageHeroImageId(slug: string): string {
  return `paris_chiro_page_${slug}_hero_image`;
}

export function parisChiroPageGalleryImageId(slug: string, n: 1 | 2 | 3): string {
  return `paris_chiro_page_${slug}_gallery_${n}`;
}

export function parisChiroPageHasImages(slug: string): boolean {
  return (PARIS_CHIRO_PAGES_WITH_IMAGES as readonly string[]).includes(slug);
}

export function parisChiroPageImageIds(slug: string): string[] {
  if (!parisChiroPageHasImages(slug)) return [];
  return [
    parisChiroPageHeroImageId(slug),
    parisChiroPageGalleryImageId(slug, 1),
    parisChiroPageGalleryImageId(slug, 2),
    parisChiroPageGalleryImageId(slug, 3),
  ];
}

function stretchFlexImageFields(title: string): ContentFieldMeta[] {
  const slug = STRETCH_FLEX_SLUG;
  return [
    {
      id: parisChiroPageHeroImageId(slug),
      pageLabel: "Paris chiro pages",
      sectionLabel: title,
      fieldLabel: "Hero logo",
      type: "image",
    },
    {
      id: parisChiroPageGalleryImageId(slug, 1),
      pageLabel: "Paris chiro pages",
      sectionLabel: title,
      fieldLabel: "Gallery photo 1",
      type: "image",
    },
    {
      id: parisChiroPageGalleryImageId(slug, 2),
      pageLabel: "Paris chiro pages",
      sectionLabel: title,
      fieldLabel: "Gallery photo 2",
      type: "image",
    },
    {
      id: parisChiroPageGalleryImageId(slug, 3),
      pageLabel: "Paris chiro pages",
      sectionLabel: title,
      fieldLabel: "Gallery photo 3",
      type: "image",
    },
  ];
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
    if (parisChiroPageHasImages(s.slug)) {
      fields.push(...stretchFlexImageFields(s.title));
    }
  }
  return fields;
}

export function buildParisChiroCmsDefaults(): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const s of PARIS_CHIRO_SERVICES) {
    defaults[parisChiroPageBodyId(s.slug)] = s.body;
    defaults[parisChiroPageMetaId(s.slug)] = s.metaDescription;
    if (s.slug === STRETCH_FLEX_SLUG) {
      defaults[parisChiroPageHeroImageId(s.slug)] = STRETCH_FLEX_IMAGES.hero;
      defaults[parisChiroPageGalleryImageId(s.slug, 1)] = STRETCH_FLEX_IMAGES.gallery1;
      defaults[parisChiroPageGalleryImageId(s.slug, 2)] = STRETCH_FLEX_IMAGES.gallery2;
      defaults[parisChiroPageGalleryImageId(s.slug, 3)] = STRETCH_FLEX_IMAGES.gallery3;
    }
  }
  return defaults;
}
