export type PageLayoutId = "massage" | "sulphur-springs" | "chiropractic";

export type PageLayoutBlockDef = {
  id: string;
  label: string;
};

export type PageLayoutPageDef = {
  id: PageLayoutId;
  label: string;
  /** Public path for preview link */
  path: string;
  blocks: PageLayoutBlockDef[];
};

export const PAGE_LAYOUT_PAGES: PageLayoutPageDef[] = [
  {
    id: "massage",
    label: "Massage",
    path: "/services/massage",
    blocks: [
      { id: "intro", label: "Intro + photo" },
      { id: "services", label: "Services we offer" },
      { id: "when_to", label: "When to get a massage" },
      { id: "team", label: "Meet the team" },
      { id: "visit", label: "Visit us in Paris" },
      { id: "schedule_cta", label: "Questions / schedule CTA" },
    ],
  },
  {
    id: "chiropractic",
    label: "Chiropractic",
    path: "/services/chiropractic",
    blocks: [
      { id: "intro", label: "Intro + conditions" },
      { id: "treatments", label: "Treatments we combine" },
      { id: "adjustments", label: "Adjustments in action" },
      { id: "doctors", label: "Our Paris chiropractors" },
      { id: "locations", label: "Paris & Sulphur locations" },
      { id: "wellness_teaser", label: "Wellness care plans teaser" },
      { id: "awards", label: "Awards strip" },
      { id: "testimonials", label: "Patient testimonials" },
      { id: "cta", label: "Book / call CTA" },
      { id: "schedule_cta", label: "Questions / schedule CTA" },
    ],
  },
  {
    id: "sulphur-springs",
    label: "Sulphur Springs",
    path: "/sulphur-springs",
    blocks: [
      { id: "featured_services", label: "Featured service tiles" },
      { id: "intro", label: "Intro & office hours" },
      { id: "doctor", label: "Doctor spotlight" },
      { id: "all_services", label: "All services & injuries" },
      { id: "quick_links", label: "Patient resources links" },
      { id: "schedule_cta", label: "Ready for relief CTA" },
    ],
  },
];

const PAGE_BY_ID = Object.fromEntries(PAGE_LAYOUT_PAGES.map((p) => [p.id, p])) as Record<
  PageLayoutId,
  PageLayoutPageDef
>;

export function pageLayoutDef(pageId: PageLayoutId): PageLayoutPageDef {
  return PAGE_BY_ID[pageId];
}

export function defaultBlockOrder(pageId: PageLayoutId): string[] {
  return pageLayoutDef(pageId).blocks.map((b) => b.id);
}

/** Keep only known ids; append any missing defaults at the end. */
export function normalizeBlockOrder(pageId: PageLayoutId, raw: unknown): string[] {
  const allowed = new Set(defaultBlockOrder(pageId));
  const defaults = defaultBlockOrder(pageId);
  const out: string[] = [];
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (typeof id === "string" && allowed.has(id) && !out.includes(id)) {
        out.push(id);
      }
    }
  }
  for (const id of defaults) {
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

export function isPageLayoutId(v: string): v is PageLayoutId {
  return v === "massage" || v === "sulphur-springs" || v === "chiropractic";
}
