import type { ContentFieldMeta } from "@/lib/cms-registry";
import { MASSAGE } from "@/lib/home-verbatim";
import { MASSAGE_SERVICE_PAGES } from "@/lib/massage-services";
import { pageMetaDefaults, pageMetaFields } from "@/lib/page-meta-cms";

/** Card name shown on /services/massage and as the header menu label. */
export function massageServiceNameId(slug: string): string {
  return `massage_service_${slug}_name`;
}

/** Card blurb shown on /services/massage. */
export function massageServiceBlurbId(slug: string): string {
  return `massage_service_${slug}_blurb`;
}

/**
 * Placeholder in the massage page search description that becomes
 * "Book online or call" / "Call or contact us to schedule" depending on
 * whether online booking is on.
 */
export const MASSAGE_META_SCHEDULE_TOKEN = "{schedule}";

/**
 * Page-level copy on /services/massage, /services/massage/<slug>,
 * /services/massage/prices and /massage-landing that used to be hard-coded.
 * Defaults are the exact text the site showed before.
 */
export const MASSAGE_PAGE_TEXT_DEFAULTS = {
  // /services/massage
  massage_page_eyebrow: "The Rub Club · Paris, TX",
  massage_page_og_description:
    "Deep tissue, prenatal, sports, and trigger-point massage at The Rub Club in Paris, TX.",
  massage_intro_title: MASSAGE.stressTitle,
  massage_intro_photo_alt:
    "A licensed massage therapist working on a client's shoulders at The Rub Club",
  massage_services_heading: "Services we offer",
  massage_services_crosslink_before: "Need more than soft-tissue work?",
  massage_services_crosslink_label: "Explore our chiropractic care",
  massage_services_crosslink_after:
    "— our massage and chiropractic teams coordinate care under one roof.",
  massage_when_heading: "When to get a massage",
  massage_when_body: MASSAGE.whenBody,
  massage_team_subtitle: "Licensed massage therapists at The Rub Club",
  massage_team_footnote_before:
    "For insurance coordination, personal injury case management, and other Paris office roles, see",
  massage_team_footnote_link: "About us — Paris office",
  massage_visit_heading: "Visit us in Paris",
  massage_visit_city_suffix: "· Paris, TX",
  massage_visit_book_label: "Book massage",
  massage_visit_prices_label: "View prices",
  massage_visit_form_label: "New-client form",
  massage_cta_title: "Have a question first?",
  massage_cta_body:
    "The massage desk can verify available times and answer questions about specific conditions.",
  // /services/massage/<slug>
  massage_subpage_eyebrow: "The Rub Club · Paris, TX",
  massage_subpage_breadcrumb: "Massage",
  massage_subpage_title_suffix: " — The Rub Club, Paris TX",
  massage_subpage_og_suffix: " — Paris, TX",
  massage_subpage_cta_title: "Book a massage",
  massage_subpage_cta_body: "Contact The Rub Club in Paris to schedule your session.",
  // /services/massage/prices
  massage_prices_eyebrow: "The Rub Club · Paris, TX",
  massage_prices_title: "Massage Prices",
  massage_prices_og_title: "Massage Prices — The Rub Club",
  massage_prices_cta_title: "Book your massage",
  massage_prices_cta_body: "Call the massage desk and we'll find a time that works for you.",
  // /massage-landing
  massage_landing_eyebrow: "The Rub Club",
  massage_landing_title: "Massage therapy in Paris, TX",
  massage_landing_lede:
    "You found us from Massage Paris Texas — welcome. Call the massage desk, contact us online, or explore our massage services and team.",
  massage_landing_section_heading: "Book your next session",
  massage_landing_body:
    "Stretch sessions are by appointment only. Walk-ins are welcome for massage when we have availability — call ahead if you are unsure.",
  massage_landing_book_label: "Book Now",
  massage_landing_services_label: "Massage services",
  massage_landing_home_label: "Main site home",
} as const;

export type MassagePageTextKey = keyof typeof MASSAGE_PAGE_TEXT_DEFAULTS;
export type MassagePageText = Record<MassagePageTextKey, string>;

type Spec = { section: string; label: string; page?: "Massage" | "Massage landing"; type?: "text" | "richtext" };

const SPEC: Record<MassagePageTextKey, Spec> = {
  massage_page_eyebrow: { section: "Hero", label: "Eyebrow (small line above the heading)" },
  massage_page_og_description: { section: "Search & browser title", label: "Social share description" },
  massage_intro_title: { section: "Intro", label: "Intro heading" },
  massage_intro_photo_alt: { section: "Intro", label: "Intro photo description (alt text)" },
  massage_services_heading: { section: "Services", label: "Section heading" },
  massage_services_crosslink_before: { section: "Services", label: "Chiropractic cross-link · text before the link" },
  massage_services_crosslink_label: { section: "Services", label: "Chiropractic cross-link · link text" },
  massage_services_crosslink_after: { section: "Services", label: "Chiropractic cross-link · text after the link" },
  massage_when_heading: { section: "When to get a massage", label: "Section heading" },
  massage_when_body: { section: "When to get a massage", label: "Paragraph", type: "richtext" },
  massage_team_subtitle: { section: "Team", label: "Subtitle under “Meet the team”" },
  massage_team_footnote_before: { section: "Team", label: "Footnote · text before the link" },
  massage_team_footnote_link: { section: "Team", label: "Footnote · link text" },
  massage_visit_heading: { section: "Visit us", label: "Section heading" },
  massage_visit_city_suffix: { section: "Visit us", label: "Text after the street address" },
  massage_visit_book_label: { section: "Visit us", label: "Book button label" },
  massage_visit_prices_label: { section: "Visit us", label: "Prices button label" },
  massage_visit_form_label: { section: "Visit us", label: "New-client form button label" },
  massage_cta_title: { section: "Question CTA", label: "Heading" },
  massage_cta_body: { section: "Question CTA", label: "Body" },
  massage_subpage_eyebrow: { section: "Massage sub-pages", label: "Eyebrow (small line above the heading)" },
  massage_subpage_breadcrumb: { section: "Massage sub-pages", label: "Breadcrumb label" },
  massage_subpage_title_suffix: { section: "Massage sub-pages", label: "Browser title suffix (after the page title)" },
  massage_subpage_og_suffix: { section: "Massage sub-pages", label: "Social share title suffix" },
  massage_subpage_cta_title: { section: "Massage sub-pages", label: "Bottom CTA heading" },
  massage_subpage_cta_body: { section: "Massage sub-pages", label: "Bottom CTA body" },
  massage_prices_eyebrow: { section: "Prices page", label: "Eyebrow (small line above the heading)" },
  massage_prices_title: { section: "Prices page", label: "Page title" },
  massage_prices_og_title: { section: "Prices page", label: "Social share title" },
  massage_prices_cta_title: { section: "Prices page", label: "Bottom CTA heading" },
  massage_prices_cta_body: { section: "Prices page", label: "Bottom CTA body" },
  massage_landing_eyebrow: { page: "Massage landing", section: "Hero", label: "Eyebrow (small line above the heading)" },
  massage_landing_title: { page: "Massage landing", section: "Hero", label: "Page title" },
  massage_landing_lede: { page: "Massage landing", section: "Hero", label: "Intro paragraph" },
  massage_landing_section_heading: { page: "Massage landing", section: "Book section", label: "Heading" },
  massage_landing_body: { page: "Massage landing", section: "Book section", label: "Body" },
  massage_landing_book_label: { page: "Massage landing", section: "Book section", label: "Book button label" },
  massage_landing_services_label: { page: "Massage landing", section: "Book section", label: "Massage services link label" },
  massage_landing_home_label: { page: "Massage landing", section: "Book section", label: "Main site link label" },
};

export const MASSAGE_PAGE_TEXT_IDS = Object.keys(MASSAGE_PAGE_TEXT_DEFAULTS) as MassagePageTextKey[];

/** Card name + blurb ids for every massage modality card. */
export const MASSAGE_SERVICE_PAGES_IDS: string[] = MASSAGE_SERVICE_PAGES.flatMap((s) => [
  massageServiceNameId(s.slug),
  massageServiceBlurbId(s.slug),
]);

/** Merge CMS values over the defaults (blank CMS values fall back). */
export function resolveMassagePageText(cms: Partial<Record<string, string>>): MassagePageText {
  const out = { ...MASSAGE_PAGE_TEXT_DEFAULTS } as MassagePageText;
  for (const key of MASSAGE_PAGE_TEXT_IDS) {
    // Keep the raw value: suffix fields carry a meaningful leading space.
    const v = cms[key];
    if (typeof v === "string" && v.trim()) out[key] = v;
  }
  return out;
}

const MASSAGE_META_DEFAULTS = {
  title: "Massage Therapy in Paris, TX — The Rub Club",
  description: `Licensed massage therapists offering deep tissue, prenatal, sports, and trigger-point therapy in Paris, TX. Same-week openings; call 903-739-9959 or ${MASSAGE_META_SCHEDULE_TOKEN}.`,
};
const MASSAGE_PRICES_META_DEFAULTS = {
  title: "Massage Prices — The Rub Club, Paris TX",
  description:
    "Massage session rates, add-ons, gift certificate packages, memberships, and Chiro-Fitness pricing at The Rub Club in Paris, TX.",
};
const MASSAGE_LANDING_META_DEFAULTS = {
  title: "Massage Therapy — Paris, TX",
  description:
    "Therapeutic massage in Paris, Texas at The Rub Club — same trusted team and convenient Northeast Texas location.",
};

/** Paris massage page cards, reviews, CTA and the massage landing page. */
export const MASSAGE_PAGE_CMS_REGISTRY: ContentFieldMeta[] = [
  ...pageMetaFields("massage", "Massage").map((f) =>
    f.id.endsWith("_meta_description")
      ? {
          ...f,
          fieldLabel: `Search result description (${MASSAGE_META_SCHEDULE_TOKEN} becomes “book online” or “call to schedule”)`,
        }
      : f,
  ),
  ...pageMetaFields("massage_prices", "Massage", "Prices page"),
  ...pageMetaFields("massage_landing", "Massage landing"),
  ...MASSAGE_PAGE_TEXT_IDS.map((id): ContentFieldMeta => {
    const s = SPEC[id];
    return {
      id,
      pageLabel: s.page ?? "Massage",
      sectionLabel: s.section,
      fieldLabel: s.label,
      type: s.type ?? "text",
    };
  }),
  ...MASSAGE_SERVICE_PAGES.flatMap((s): ContentFieldMeta[] => [
    {
      id: massageServiceNameId(s.slug),
      pageLabel: "Massage",
      sectionLabel: `Card · ${s.name}`,
      fieldLabel: "Card name (also the header menu label)",
      type: "text",
    },
    {
      id: massageServiceBlurbId(s.slug),
      pageLabel: "Massage",
      sectionLabel: `Card · ${s.name}`,
      fieldLabel: "Card blurb",
      type: "text",
    },
  ]),
];

export const MASSAGE_PAGE_CMS_DEFAULTS: Record<string, string> = {
  ...pageMetaDefaults("massage", MASSAGE_META_DEFAULTS),
  ...pageMetaDefaults("massage_prices", MASSAGE_PRICES_META_DEFAULTS),
  ...pageMetaDefaults("massage_landing", MASSAGE_LANDING_META_DEFAULTS),
  ...MASSAGE_PAGE_TEXT_DEFAULTS,
  ...Object.fromEntries(
    MASSAGE_SERVICE_PAGES.flatMap((s) => [
      [massageServiceNameId(s.slug), s.name],
      [massageServiceBlurbId(s.slug), s.blurb],
    ]),
  ),
};
