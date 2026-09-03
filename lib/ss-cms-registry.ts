import type { ContentFieldMeta, ContentPageKey } from "@/lib/cms-registry";
import { IMAGES } from "@/lib/home-images";
import { MASSAGE_PRICES_DEFAULT } from "@/lib/massage-prices-content";
import {
  buildSSWellnessCmsRegistry,
  ssWellnessCarePlansDefaults,
} from "@/lib/ss-wellness-care-plans-content";
import {
  SS_INJURIES,
  SS_PATIENT_RESOURCES,
  SS_RESOURCE_ARTICLES,
  SS_SERVICES,
  buildSSChiroNavChildren,
} from "@/lib/sulphur-springs-content";

export function ssPageBodyId(slug: string): string {
  return `ss_page_${slug}_body`;
}

export function ssPageTitleId(slug: string): string {
  return `ss_page_${slug}_title`;
}

/** Label shown for this page in the header Services menu. */
export function ssPageNavLabelId(slug: string): string {
  return `ss_page_${slug}_nav_label`;
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

/**
 * One page's worth of fields. Each page gets its own `sectionLabel` (its title)
 * so the editor's page picker can show a single page at a time instead of one
 * 100-field scroll.
 */
function pageFields(
  page: { slug: string; title: string },
  pageLabel: ContentPageKey,
  opts: { cards: boolean },
): ContentFieldMeta[] {
  const fields: ContentFieldMeta[] = [
    {
      id: ssPageTitleId(page.slug),
      pageLabel,
      sectionLabel: page.title,
      fieldLabel: "Page title (heading at the top of the page)",
      type: "text",
    },
    ...(opts.cards
      ? [
          {
            id: ssPageNavLabelId(page.slug),
            pageLabel,
            sectionLabel: page.title,
            fieldLabel: "Menu label (header Services dropdown)",
            type: "text" as const,
          },
        ]
      : []),
    {
      id: ssPageBodyId(page.slug),
      pageLabel,
      sectionLabel: page.title,
      fieldLabel: "Page body (## headings, - bullets, blank line between paragraphs)",
      type: "richtext",
    },
    {
      id: ssPageMetaId(page.slug),
      pageLabel,
      sectionLabel: page.title,
      fieldLabel: "SEO meta description (optional override)",
      type: "text",
    },
  ];
  // Resource articles have no card on any services grid.
  if (opts.cards) {
    fields.push(
      {
        id: ssPageCardBlurbId(page.slug),
        pageLabel,
        sectionLabel: page.title,
        fieldLabel: "Services grid card blurb (optional; falls back to meta description)",
        type: "text",
      },
      {
        id: ssPageCardImageId(page.slug),
        pageLabel,
        sectionLabel: page.title,
        fieldLabel: "Photo (optional; shows on this page and on its services grid card)",
        type: "image",
      },
    );
  }
  return fields;
}

/** CMS registry fields for Sulphur Springs treatment, injury, and patient resources pages. */
export function buildSSCmsRegistry(): ContentFieldMeta[] {
  const fields: ContentFieldMeta[] = [];

  for (const s of SS_SERVICES) {
    fields.push(...pageFields(s, "SS subpages", { cards: true }));
  }
  for (const i of SS_INJURIES) {
    fields.push(...pageFields(i, "SS conditions", { cards: true }));
  }
  for (const a of SS_RESOURCE_ARTICLES) {
    fields.push(...pageFields(a, "SS patient resources", { cards: false }));
  }

  fields.push({
    id: "ss_patient_resources_intro",
    pageLabel: "SS patient resources",
    sectionLabel: "Patient resources landing page",
    fieldLabel: "Intro paragraph",
    type: "richtext",
  });

  fields.push(...buildSSWellnessCmsRegistry());

  fields.push({
    id: "ss_massage_prices_body",
    pageLabel: "SS prices",
    sectionLabel: "Massage prices",
    fieldLabel: "Prices page body (markdown)",
    type: "richtext",
  });

  return fields;
}

/**
 * Starting photos for Sulphur Springs service pages, so a page isn't blank
 * before anyone uploads. Only slugs with clearly matching artwork are listed —
 * a wrong-but-present photo on a clinical page is worse than an icon. Every
 * other page still gets an upload slot in the editor.
 */
const SS_PAGE_DEFAULT_PHOTOS: Record<string, string> = {
  "therapeutic-massage": IMAGES.serviceTherapeutic,
};

export function buildSSCmsDefaults(): Record<string, string> {
  const defaults: Record<string, string> = {
    ss_patient_resources_intro: SS_PATIENT_RESOURCES.intro,
  };
  const navLabelBySlug = new Map(
    buildSSChiroNavChildren().map((c) => [c.href.split("/").pop() ?? "", c.label] as const),
  );

  for (const s of SS_SERVICES) {
    defaults[ssPageTitleId(s.slug)] = s.title;
    defaults[ssPageNavLabelId(s.slug)] = navLabelBySlug.get(s.slug) ?? s.title;
    defaults[ssPageBodyId(s.slug)] = s.body;
    defaults[ssPageMetaId(s.slug)] = s.metaDescription;
    defaults[ssPageCardBlurbId(s.slug)] = "";
    defaults[ssPageCardImageId(s.slug)] = SS_PAGE_DEFAULT_PHOTOS[s.slug] ?? "";
  }
  for (const i of SS_INJURIES) {
    defaults[ssPageTitleId(i.slug)] = i.title;
    defaults[ssPageNavLabelId(i.slug)] = navLabelBySlug.get(i.slug) ?? i.title;
    defaults[ssPageBodyId(i.slug)] = i.body;
    defaults[ssPageMetaId(i.slug)] = i.metaDescription;
    defaults[ssPageCardBlurbId(i.slug)] = "";
    defaults[ssPageCardImageId(i.slug)] = "";
  }
  for (const a of SS_RESOURCE_ARTICLES) {
    defaults[ssPageTitleId(a.slug)] = a.title;
    defaults[ssPageBodyId(a.slug)] = a.body;
    defaults[ssPageMetaId(a.slug)] = a.metaDescription;
  }

  Object.assign(defaults, ssWellnessCarePlansDefaults());
  defaults.ss_massage_prices_body = MASSAGE_PRICES_DEFAULT;

  return defaults;
}

export const SS_PAGE_SLUGS = [
  ...SS_SERVICES.map((s) => s.slug),
  ...SS_INJURIES.map((i) => i.slug),
  ...SS_RESOURCE_ARTICLES.map((a) => a.slug),
] as const;
