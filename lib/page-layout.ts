import type { ContentPageKey } from "@/lib/cms";

export type PageLayoutId = "massage" | "sulphur-springs" | "chiropractic";

export type PageLayoutPreviewKey =
  | "introPhoto"
  | "servicesGrid"
  | "teamGrid"
  | "doctorCards"
  | "cta"
  | "staticSection"
  | "locations"
  | "testimonials"
  | "featuredTiles"
  | "hoursIntro"
  | "doctorSpotlight"
  | "serviceLinks";

export type PageLayoutBlockDef = {
  id: string;
  label: string;
  description?: string;
  cmsFieldIds?: string[];
  siteContentPage?: ContentPageKey;
  /** Admin-only link when no CMS fields (legacy). */
  adminLink?: { href: string; label: string };
  /** Embedded admin UI in page builder inspector. */
  embedKey?: "massage-team" | "doctors" | "sulphur-staff";
  previewKey: PageLayoutPreviewKey;
};

export type PageLayoutPageDef = {
  id: PageLayoutId;
  label: string;
  path: string;
  blocks: PageLayoutBlockDef[];
};

export type PageLayoutState = {
  blockOrder: string[];
  hiddenBlocks: string[];
};

export const PAGE_LAYOUT_PAGES: PageLayoutPageDef[] = [
  {
    id: "massage",
    label: "Massage",
    path: "/services/massage",
    blocks: [
      {
        id: "intro",
        label: "Intro + photo",
        description: "Opening copy with patient photo",
        cmsFieldIds: ["massage_intro_body"],
        siteContentPage: "Massage",
        previewKey: "introPhoto",
      },
      {
        id: "services",
        label: "Services we offer",
        description: "Service list or default tiles",
        cmsFieldIds: ["massage_services_list"],
        siteContentPage: "Massage",
        previewKey: "servicesGrid",
      },
      {
        id: "when_to",
        label: "When to get a massage",
        description: "Static guidance section",
        previewKey: "staticSection",
      },
      {
        id: "team",
        label: "Meet the team",
        description: "Licensed massage therapists",
        previewKey: "teamGrid",
        embedKey: "massage-team",
      },
      {
        id: "visit",
        label: "Visit us in Paris",
        description: "Paris office address and booking",
        previewKey: "staticSection",
      },
      {
        id: "schedule_cta",
        label: "Questions / schedule CTA",
        description: "Schedule or call card",
        cmsFieldIds: ["massage_cta_heading"],
        siteContentPage: "Massage",
        previewKey: "cta",
      },
    ],
  },
  {
    id: "chiropractic",
    label: "Chiropractic",
    path: "/services/chiropractic",
    blocks: [
      {
        id: "intro",
        label: "Intro + conditions",
        description: "Intro copy and conditions list",
        cmsFieldIds: ["chiro_intro_body", "chiro_conditions_list"],
        siteContentPage: "Chiropractic",
        previewKey: "introPhoto",
      },
      {
        id: "treatments",
        label: "Treatments we combine",
        description: "Treatment offerings grid",
        previewKey: "staticSection",
      },
      {
        id: "adjustments",
        label: "Adjustments in action",
        description: "Video / action section",
        previewKey: "staticSection",
      },
      {
        id: "doctors",
        label: "Our Paris chiropractors",
        description: "Doctor cards from CMS",
        cmsFieldIds: [
          "doctor_greg_name",
          "doctor_greg_role",
          "doctor_greg_bio",
          "doctor_greg_photo",
          "doctor_greg_video",
          "doctor_sean_name",
          "doctor_sean_role",
          "doctor_sean_bio",
          "doctor_sean_photo",
          "doctor_sean_video",
          "doctor_brandy_name",
          "doctor_brandy_role",
          "doctor_brandy_bio",
          "doctor_brandy_photo",
          "doctor_brandy_video",
        ],
        siteContentPage: "Doctors",
        previewKey: "doctorCards",
        embedKey: "doctors",
      },
      {
        id: "locations",
        label: "Paris & Sulphur locations",
        description: "Two-office location cards",
        previewKey: "locations",
      },
      {
        id: "wellness_teaser",
        label: "Wellness care plans teaser",
        description: "Link to wellness plans page",
        cmsFieldIds: ["chiro_wellness_teaser_heading", "chiro_wellness_teaser_body"],
        siteContentPage: "Chiropractic",
        previewKey: "cta",
      },
      {
        id: "awards",
        label: "Awards strip",
        description: "Recognition logos",
        previewKey: "staticSection",
      },
      {
        id: "testimonials",
        label: "Patient testimonials",
        description: "Up to three quotes",
        cmsFieldIds: [
          "chiro_testimonial_1_text",
          "chiro_testimonial_1_attr",
          "chiro_testimonial_2_text",
          "chiro_testimonial_2_attr",
          "chiro_testimonial_3_text",
          "chiro_testimonial_3_attr",
        ],
        siteContentPage: "Chiropractic",
        previewKey: "testimonials",
      },
      {
        id: "cta",
        label: "Book / call CTA",
        description: "Primary booking call-to-action",
        cmsFieldIds: ["chiro_cta_heading", "chiro_cta_subtext"],
        siteContentPage: "Chiropractic",
        previewKey: "cta",
      },
      {
        id: "schedule_cta",
        label: "Questions / schedule CTA",
        description: "Secondary schedule card",
        previewKey: "cta",
      },
    ],
  },
  {
    id: "sulphur-springs",
    label: "Sulphur Springs",
    path: "/sulphur-springs",
    blocks: [
      {
        id: "featured_services",
        label: "Featured service tiles",
        description: "Top row of service shortcuts",
        previewKey: "featuredTiles",
      },
      {
        id: "intro",
        label: "Intro & office hours",
        description: "Welcome copy and hours table",
        cmsFieldIds: ["ss_intro_body", "ss_hours"],
        siteContentPage: "Sulphur Springs",
        previewKey: "hoursIntro",
      },
      {
        id: "doctor",
        label: "Doctor spotlight",
        description: "Featured chiropractor",
        siteContentPage: "Sulphur staff",
        previewKey: "doctorSpotlight",
        embedKey: "sulphur-staff",
      },
      {
        id: "all_services",
        label: "All services & injuries",
        description: "Service and injury link grids",
        previewKey: "serviceLinks",
      },
      {
        id: "quick_links",
        label: "Patient resources links",
        description: "Resources shortcut buttons",
        previewKey: "serviceLinks",
      },
      {
        id: "schedule_cta",
        label: "Ready for relief CTA",
        description: "Appointment request card",
        previewKey: "cta",
      },
    ],
  },
];

const PAGE_BY_ID = Object.fromEntries(PAGE_LAYOUT_PAGES.map((p) => [p.id, p])) as Record<
  PageLayoutId,
  PageLayoutPageDef
>;

const BLOCK_BY_PAGE = Object.fromEntries(
  PAGE_LAYOUT_PAGES.map((p) => [
    p.id,
    Object.fromEntries(p.blocks.map((b) => [b.id, b])),
  ]),
) as Record<PageLayoutId, Record<string, PageLayoutBlockDef>>;

export function pageLayoutDef(pageId: PageLayoutId): PageLayoutPageDef {
  return PAGE_BY_ID[pageId];
}

export function blockDef(pageId: PageLayoutId, blockId: string): PageLayoutBlockDef | undefined {
  return BLOCK_BY_PAGE[pageId]?.[blockId];
}

export function defaultBlockOrder(pageId: PageLayoutId): string[] {
  return pageLayoutDef(pageId).blocks.map((b) => b.id);
}

export function defaultPageLayout(pageId: PageLayoutId): PageLayoutState {
  return { blockOrder: defaultBlockOrder(pageId), hiddenBlocks: [] };
}

const allowedIds = (pageId: PageLayoutId) => new Set(defaultBlockOrder(pageId));

/** blockOrder: known ids on page only (no auto-append removed blocks). */
export function normalizeBlockOrder(pageId: PageLayoutId, raw: unknown): string[] {
  const allowed = allowedIds(pageId);
  const out: string[] = [];
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (typeof id === "string" && allowed.has(id) && !out.includes(id)) {
        out.push(id);
      }
    }
  }
  return out.length > 0 ? out : defaultBlockOrder(pageId);
}

export function normalizeHiddenBlocks(
  pageId: PageLayoutId,
  blockOrder: string[],
  raw: unknown,
): string[] {
  const onPage = new Set(blockOrder);
  const out: string[] = [];
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (typeof id === "string" && onPage.has(id) && !out.includes(id)) {
        out.push(id);
      }
    }
  }
  return out;
}

export function normalizePageLayout(
  pageId: PageLayoutId,
  raw: { blockOrder?: unknown; hiddenBlocks?: unknown },
): PageLayoutState {
  const blockOrder = normalizeBlockOrder(pageId, raw.blockOrder);
  const hiddenBlocks = normalizeHiddenBlocks(pageId, blockOrder, raw.hiddenBlocks);
  return { blockOrder, hiddenBlocks };
}

export function paletteBlockIds(pageId: PageLayoutId, blockOrder: string[]): string[] {
  const onPage = new Set(blockOrder);
  return pageLayoutDef(pageId).blocks.map((b) => b.id).filter((id) => !onPage.has(id));
}

export function visibleBlockOrder(layout: PageLayoutState): string[] {
  const hidden = new Set(layout.hiddenBlocks);
  return layout.blockOrder.filter((id) => !hidden.has(id));
}

export function isPageLayoutId(v: string): v is PageLayoutId {
  return v === "massage" || v === "sulphur-springs" || v === "chiropractic";
}

/** All CMS field ids referenced by blocks on a page (for preview API). */
export function allCmsFieldIdsForPage(pageId: PageLayoutId): string[] {
  const ids = new Set<string>();
  for (const b of pageLayoutDef(pageId).blocks) {
    for (const f of b.cmsFieldIds ?? []) {
      ids.add(f);
    }
  }
  if (pageId === "chiropractic") {
    for (const key of [
      "doctor_greg_bio",
      "doctor_sean_bio",
      "doctor_brandy_bio",
      "chiro_hero_heading",
    ]) {
      ids.add(key);
    }
  }
  if (pageId === "sulphur-springs") {
    ids.add("ss_hero_heading");
  }
  if (pageId === "massage") {
    ids.add("massage_hero_heading");
  }
  return [...ids];
}

export const PAGE_LAYOUT_REVALIDATE_PATHS: Record<PageLayoutId, string> = {
  massage: "/services/massage",
  chiropractic: "/services/chiropractic",
  "sulphur-springs": "/sulphur-springs",
};
