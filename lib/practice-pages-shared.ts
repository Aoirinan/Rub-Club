/**
 * Client-safe types, constants, and sanitizers for the practice landing pages
 * (practice_pages Firestore collection). Server reads/derivation live in
 * lib/practice-pages.ts — keep firebase-admin imports out of this file.
 */

export const PRACTICE_PAGES_COLLECTION = "practice_pages";
export const PRACTICE_TESTIMONIALS_SUBCOLLECTION = "testimonials";

export type PracticeLocationId = "paris-home" | "paris-chiro" | "sulphur-springs";

export const PRACTICE_LOCATION_IDS: readonly PracticeLocationId[] = [
  "paris-home",
  "paris-chiro",
  "sulphur-springs",
];

export function isPracticeLocationId(v: string): v is PracticeLocationId {
  return v === "paris-home" || v === "paris-chiro" || v === "sulphur-springs";
}

export const PRACTICE_PAGE_PATHS: Record<PracticeLocationId, string> = {
  "paris-home": "/",
  "paris-chiro": "/services/chiropractic",
  "sulphur-springs": "/sulphur-springs",
};

export const PRACTICE_LOCATION_LABELS: Record<PracticeLocationId, string> = {
  "paris-home": "Paris — Home page",
  "paris-chiro": "Paris — Chiropractic",
  "sulphur-springs": "Sulphur Springs",
};

/* ------------------------------------------------------------------ */
/*  Section types                                                      */
/* ------------------------------------------------------------------ */

export type PracticePhoneLine = { label: string; number: string };
export type PracticeSocialLink = { platform: string; url: string };

export type PracticeUtilityBar = {
  published: boolean;
  phones: PracticePhoneLine[];
  address: string;
  mapsUrl: string;
  socialLinks: PracticeSocialLink[];
};

export type PracticeHeroSection = {
  published: boolean;
  eyebrow: string;
  heading: string;
  tagline: string;
  imageUrl: string;
  /** Optional extra hero photos (slide 1 is `imageUrl`); empty = static hero. */
  slides: string[];
  ctaLabel: string;
  /** Optional link target; empty string keeps the call-to-book phone modal. */
  ctaUrl: string;
  callPhone: string;
};

export type PracticeQuickAction = { label: string; icon: string; url: string };

export type PracticeQuickActionsSection = {
  published: boolean;
  items: PracticeQuickAction[];
};

export type PracticeServiceCard = {
  name: string;
  blurb: string;
  imageUrl: string;
  href: string;
};

export type PracticeServicesGridSection = {
  published: boolean;
  heading: string;
  intro: string;
  /** "custom" renders `cards`; "ss-services" derives cards from SS_SERVICES + CMS overrides. */
  mode: "custom" | "ss-services";
  cards: PracticeServiceCard[];
};

export type PracticeAboutBlock = {
  id: string;
  published: boolean;
  heading: string;
  body: string;
  bullets: string[];
  imageUrl: string;
  phoneCtaLabel: string;
  /** Optional secondary CTA link (e.g. "Explore massage services"). */
  ctaLabel: string;
  ctaUrl: string;
};

export type PracticeReviewsSection = {
  published: boolean;
  heading: string;
  linkToReviewsPage: boolean;
  reviewsUrl: string;
  reviewsLinkLabel: string;
};

export type PracticeTeamSource = "paris-doctors" | "ss-staff" | "rub-club-team";

export type PracticeTeamSection = {
  id: string;
  published: boolean;
  heading: string;
  intro: string;
  source: PracticeTeamSource;
  /** "cards" = photo grid; "expanded" = full bios/videos (home page doctors). */
  variant: "cards" | "expanded";
  linkUrl: string;
  linkLabel: string;
};

export type PracticeLocationBlockSection = {
  published: boolean;
  heading: string;
  mapEmbedUrl: string;
  hoursSource: "paris" | "ss";
  showSecondaryLocations: boolean;
};

export type PracticeExtra = {
  id: string;
  published: boolean;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  links: { label: string; url: string }[];
};

export type PracticeStickyBarSection = {
  enabled: boolean;
  callLabel: string;
  phone: string;
  bookLabel: string;
  bookUrl: string;
};

/**
 * CMS-editable theme colors for a practice page. Empty string = use the
 * built-in default for the location (red for Paris, blue for Sulphur Springs).
 * Hero panel stops may be 8-digit hex (alpha).
 */
export type PracticeThemeColors = {
  accent: string;
  accentHover: string;
  heading: string;
  heroPanelFrom: string;
  heroPanelVia: string;
  ctaBg: string;
  ctaHover: string;
};

export const EMPTY_PRACTICE_THEME: PracticeThemeColors = {
  accent: "",
  accentHover: "",
  heading: "",
  heroPanelFrom: "",
  heroPanelVia: "",
  ctaBg: "",
  ctaHover: "",
};

export type PracticePageDoc = {
  id: PracticeLocationId;
  /** Color overrides; empty values fall back to the location defaults. */
  theme: PracticeThemeColors;
  utilityBar: PracticeUtilityBar;
  hero: PracticeHeroSection;
  quickActions: PracticeQuickActionsSection;
  servicesGrid: PracticeServicesGridSection;
  /** Stacked welcome blocks (backpro stacks two on the home page). */
  aboutBlocks: PracticeAboutBlock[];
  reviews: PracticeReviewsSection;
  /** One or more provider strips (home shows doctors + massage team). */
  teamSections: PracticeTeamSection[];
  locationBlock: PracticeLocationBlockSection;
  extras: PracticeExtra[];
  stickyCallBar: PracticeStickyBarSection;
};

export type PracticeTestimonial = {
  id: string;
  name: string;
  /** Short label under the name, e.g. "Auto injury recovery · Google review". */
  context: string;
  quote: string;
  order: number;
  published: boolean;
};

/* ------------------------------------------------------------------ */
/*  Sanitizing merge (untrusted/raw data over known-good defaults)     */
/* ------------------------------------------------------------------ */

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function mergeUtilityBar(raw: unknown, d: PracticeUtilityBar): PracticeUtilityBar {
  if (!isRecord(raw)) return d;
  return {
    published: bool(raw.published, d.published),
    phones: Array.isArray(raw.phones)
      ? raw.phones
          .filter(isRecord)
          .map((p) => ({ label: str(p.label, ""), number: str(p.number, "") }))
          .filter((p) => p.number.trim().length > 0)
      : d.phones,
    address: str(raw.address, d.address),
    mapsUrl: str(raw.mapsUrl, d.mapsUrl),
    socialLinks: Array.isArray(raw.socialLinks)
      ? raw.socialLinks
          .filter(isRecord)
          .map((s) => ({ platform: str(s.platform, ""), url: str(s.url, "") }))
          .filter((s) => s.url.trim().length > 0)
      : d.socialLinks,
  };
}

function mergeHero(raw: unknown, d: PracticeHeroSection): PracticeHeroSection {
  if (!isRecord(raw)) return d;
  return {
    published: bool(raw.published, d.published),
    eyebrow: str(raw.eyebrow, d.eyebrow),
    heading: str(raw.heading, d.heading),
    tagline: str(raw.tagline, d.tagline),
    imageUrl: str(raw.imageUrl, d.imageUrl),
    slides: Array.isArray(raw.slides)
      ? raw.slides.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : d.slides,
    ctaLabel: str(raw.ctaLabel, d.ctaLabel),
    ctaUrl: str(raw.ctaUrl, d.ctaUrl),
    callPhone: str(raw.callPhone, d.callPhone),
  };
}

function mergeQuickActions(
  raw: unknown,
  d: PracticeQuickActionsSection,
): PracticeQuickActionsSection {
  if (!isRecord(raw)) return d;
  return {
    published: bool(raw.published, d.published),
    items: Array.isArray(raw.items)
      ? raw.items
          .filter(isRecord)
          .map((i) => ({ label: str(i.label, ""), icon: str(i.icon, ""), url: str(i.url, "") }))
          .filter((i) => i.label.trim().length > 0)
      : d.items,
  };
}

function mergeServicesGrid(
  raw: unknown,
  d: PracticeServicesGridSection,
): PracticeServicesGridSection {
  if (!isRecord(raw)) return d;
  return {
    published: bool(raw.published, d.published),
    heading: str(raw.heading, d.heading),
    intro: str(raw.intro, d.intro),
    mode: raw.mode === "custom" || raw.mode === "ss-services" ? raw.mode : d.mode,
    cards: Array.isArray(raw.cards)
      ? raw.cards
          .filter(isRecord)
          .map((card) => ({
            name: str(card.name, ""),
            blurb: str(card.blurb, ""),
            imageUrl: str(card.imageUrl, ""),
            href: str(card.href, ""),
          }))
          .filter((card) => card.name.trim().length > 0)
      : d.cards,
  };
}

function mergeAboutBlock(raw: unknown, d: PracticeAboutBlock): PracticeAboutBlock {
  if (!isRecord(raw)) return d;
  return {
    id: str(raw.id, d.id),
    published: bool(raw.published, d.published),
    heading: str(raw.heading, d.heading),
    body: str(raw.body, d.body),
    bullets: Array.isArray(raw.bullets)
      ? raw.bullets.filter((b): b is string => typeof b === "string" && b.trim().length > 0)
      : d.bullets,
    imageUrl: str(raw.imageUrl, d.imageUrl),
    phoneCtaLabel: str(raw.phoneCtaLabel, d.phoneCtaLabel),
    ctaLabel: str(raw.ctaLabel, d.ctaLabel),
    ctaUrl: str(raw.ctaUrl, d.ctaUrl),
  };
}

const EMPTY_ABOUT_BLOCK: PracticeAboutBlock = {
  id: "",
  published: true,
  heading: "",
  body: "",
  bullets: [],
  imageUrl: "",
  phoneCtaLabel: "",
  ctaLabel: "",
  ctaUrl: "",
};

/**
 * `aboutBlocks` array, with back-compat for docs saved before the array
 * existed (single `about` map → first block).
 */
function mergeAboutBlocks(rawDoc: Record<string, unknown>, d: PracticeAboutBlock[]): PracticeAboutBlock[] {
  if (Array.isArray(rawDoc.aboutBlocks)) {
    return rawDoc.aboutBlocks
      .filter(isRecord)
      .map((b, idx) =>
        mergeAboutBlock(b, d[idx] ?? { ...EMPTY_ABOUT_BLOCK, id: `about_${idx}` }),
      );
  }
  if (isRecord(rawDoc.about) && d.length > 0) {
    return [mergeAboutBlock(rawDoc.about, d[0]!), ...d.slice(1)];
  }
  return d;
}

function mergeReviews(raw: unknown, d: PracticeReviewsSection): PracticeReviewsSection {
  if (!isRecord(raw)) return d;
  return {
    published: bool(raw.published, d.published),
    heading: str(raw.heading, d.heading),
    linkToReviewsPage: bool(raw.linkToReviewsPage, d.linkToReviewsPage),
    reviewsUrl: str(raw.reviewsUrl, d.reviewsUrl),
    reviewsLinkLabel: str(raw.reviewsLinkLabel, d.reviewsLinkLabel),
  };
}

function isTeamSource(v: unknown): v is PracticeTeamSource {
  return v === "paris-doctors" || v === "ss-staff" || v === "rub-club-team";
}

function mergeTeamSection(raw: unknown, d: PracticeTeamSection): PracticeTeamSection {
  if (!isRecord(raw)) return d;
  return {
    id: str(raw.id, d.id),
    published: bool(raw.published, d.published),
    heading: str(raw.heading, d.heading),
    intro: str(raw.intro, d.intro),
    source: isTeamSource(raw.source) ? raw.source : d.source,
    variant: raw.variant === "cards" || raw.variant === "expanded" ? raw.variant : d.variant,
    linkUrl: str(raw.linkUrl, d.linkUrl),
    linkLabel: str(raw.linkLabel, d.linkLabel),
  };
}

const EMPTY_TEAM_SECTION: PracticeTeamSection = {
  id: "",
  published: true,
  heading: "",
  intro: "",
  source: "paris-doctors",
  variant: "cards",
  linkUrl: "",
  linkLabel: "",
};

/**
 * `teamSections` array, with back-compat for docs saved before the array
 * existed (single `team` map → first section).
 */
function mergeTeamSections(
  rawDoc: Record<string, unknown>,
  d: PracticeTeamSection[],
): PracticeTeamSection[] {
  if (Array.isArray(rawDoc.teamSections)) {
    return rawDoc.teamSections
      .filter(isRecord)
      .map((s, idx) =>
        mergeTeamSection(s, d[idx] ?? { ...EMPTY_TEAM_SECTION, id: `team_${idx}` }),
      );
  }
  if (isRecord(rawDoc.team) && d.length > 0) {
    return [mergeTeamSection(rawDoc.team, d[0]!), ...d.slice(1)];
  }
  return d;
}

function mergeLocationBlock(
  raw: unknown,
  d: PracticeLocationBlockSection,
): PracticeLocationBlockSection {
  if (!isRecord(raw)) return d;
  return {
    published: bool(raw.published, d.published),
    heading: str(raw.heading, d.heading),
    mapEmbedUrl: str(raw.mapEmbedUrl, d.mapEmbedUrl),
    hoursSource:
      raw.hoursSource === "paris" || raw.hoursSource === "ss" ? raw.hoursSource : d.hoursSource,
    showSecondaryLocations: bool(raw.showSecondaryLocations, d.showSecondaryLocations),
  };
}

function mergeExtras(raw: unknown, d: PracticeExtra[]): PracticeExtra[] {
  if (!Array.isArray(raw)) return d;
  return raw.filter(isRecord).map((e, idx) => ({
    id: str(e.id, `extra_${idx}`),
    published: bool(e.published, true),
    heading: str(e.heading, ""),
    body: str(e.body, ""),
    ctaLabel: str(e.ctaLabel, ""),
    ctaUrl: str(e.ctaUrl, ""),
    links: Array.isArray(e.links)
      ? e.links
          .filter(isRecord)
          .map((l) => ({ label: str(l.label, ""), url: str(l.url, "") }))
          .filter((l) => l.label.trim().length > 0 && l.url.trim().length > 0)
      : [],
  }));
}

function mergeStickyBar(raw: unknown, d: PracticeStickyBarSection): PracticeStickyBarSection {
  if (!isRecord(raw)) return d;
  return {
    enabled: bool(raw.enabled, d.enabled),
    callLabel: str(raw.callLabel, d.callLabel),
    phone: str(raw.phone, d.phone),
    bookLabel: str(raw.bookLabel, d.bookLabel),
    bookUrl: str(raw.bookUrl, d.bookUrl),
  };
}

const THEME_HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function themeHex(v: unknown, fallback: string): string {
  return typeof v === "string" && (v.trim() === "" || THEME_HEX_RE.test(v.trim()))
    ? v.trim().toLowerCase()
    : fallback;
}

function mergeTheme(raw: unknown, d: PracticeThemeColors): PracticeThemeColors {
  if (!isRecord(raw)) return d;
  return {
    accent: themeHex(raw.accent, d.accent),
    accentHover: themeHex(raw.accentHover, d.accentHover),
    heading: themeHex(raw.heading, d.heading),
    heroPanelFrom: themeHex(raw.heroPanelFrom, d.heroPanelFrom),
    heroPanelVia: themeHex(raw.heroPanelVia, d.heroPanelVia),
    ctaBg: themeHex(raw.ctaBg, d.ctaBg),
    ctaHover: themeHex(raw.ctaHover, d.ctaHover),
  };
}

export function mergePracticePageDoc(raw: unknown, defaults: PracticePageDoc): PracticePageDoc {
  if (!isRecord(raw)) return defaults;
  return {
    id: defaults.id,
    theme: mergeTheme(raw.theme, defaults.theme),
    utilityBar: mergeUtilityBar(raw.utilityBar, defaults.utilityBar),
    hero: mergeHero(raw.hero, defaults.hero),
    quickActions: mergeQuickActions(raw.quickActions, defaults.quickActions),
    servicesGrid: mergeServicesGrid(raw.servicesGrid, defaults.servicesGrid),
    aboutBlocks: mergeAboutBlocks(raw, defaults.aboutBlocks),
    reviews: mergeReviews(raw.reviews, defaults.reviews),
    teamSections: mergeTeamSections(raw, defaults.teamSections),
    locationBlock: mergeLocationBlock(raw.locationBlock, defaults.locationBlock),
    extras: mergeExtras(raw.extras, defaults.extras),
    stickyCallBar: mergeStickyBar(raw.stickyCallBar, defaults.stickyCallBar),
  };
}

export function parsePracticeTestimonialDoc(
  id: string,
  data: Record<string, unknown> | undefined,
): PracticeTestimonial {
  return {
    id,
    name: str(data?.name, ""),
    context: str(data?.context, ""),
    quote: str(data?.quote, ""),
    order: typeof data?.order === "number" ? data.order : 0,
    published: bool(data?.published, false),
  };
}

/** Unpublished placeholder testimonials created by the seed script. */
export const PRACTICE_TESTIMONIAL_PLACEHOLDERS: ReadonlyArray<{
  name: string;
  quote: string;
}> = [
  {
    name: "Placeholder patient 1",
    quote: "Replace this placeholder with a real patient review, then publish it.",
  },
  {
    name: "Placeholder patient 2",
    quote: "Replace this placeholder with a real patient review, then publish it.",
  },
  {
    name: "Placeholder patient 3",
    quote: "Replace this placeholder with a real patient review, then publish it.",
  },
];
