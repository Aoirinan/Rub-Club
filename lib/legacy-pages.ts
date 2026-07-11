/**
 * Legacy page platform (CURSOR_PROMPT.md §5).
 *
 * Every content page scraped off the three legacy sites (staged in the
 * `legacy_import` collection) is promoted 1:1 into `legacyPages`, then rendered
 * VERBATIM at this repo's existing route conventions:
 *
 *   massage-paris__<slug>  -> /services/massage/<slug>
 *   chiro-paris__<slug>    -> /services/chiropractic/<slug>
 *   chiro-sulphur__<slug>  -> /sulphur-springs/<slug>
 *
 * Promotion (scripts/promote-legacy-pages.ts) is ADDITIVE and never overwrites
 * curated pages; where a curated route already owns a slug, the legacy doc is
 * kept for reference (published=false, hasCuratedRoute=true) and the curated
 * page continues to render. Genuinely new slugs render through this module.
 */
import { getFirestore } from "@/lib/firebase-admin";

export const LEGACY_IMPORT_COLLECTION = "legacy_import";
export const LEGACY_PAGES_COLLECTION = "legacyPages";

export type LegacySite = "massage-paris" | "chiro-paris" | "chiro-sulphur";

export type LegacyBlock = { tag: string; text: string };
export type LegacyImage = { url: string; alt: string; title?: string; caption?: string };

export type LegacyPage = {
  /** `${site}__${slug}` — the Firestore document id (matches legacy_import). */
  id: string;
  site: LegacySite;
  slug: string;
  /** Canonical route on the new site. */
  route: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  /** VERBATIM body blocks (tag + text), the render source. */
  blocks: LegacyBlock[];
  /** VERBATIM raw contentHtml (may be empty when offloaded — see contentHtmlUrl). */
  body: string;
  contentHtmlUrl: string;
  heroImage: string;
  images: LegacyImage[];
  order: number;
  published: boolean;
  /** True when an existing curated route already owns this path. */
  hasCuratedRoute: boolean;
  sourceUrl: string;
};

const SITE_ROUTE_PREFIX: Record<LegacySite, string> = {
  "massage-paris": "/services/massage",
  "chiro-paris": "/services/chiropractic",
  "chiro-sulphur": "/sulphur-springs",
};

export function legacySiteRoutePrefix(site: LegacySite): string {
  return SITE_ROUTE_PREFIX[site];
}

/** Canonical new-site route for a legacy (site, slug) pair. */
export function legacyRoute(site: LegacySite, slug: string): string {
  return `${SITE_ROUTE_PREFIX[site]}/${slug}`;
}

export function legacyDocId(site: LegacySite, slug: string): string {
  return `${site}__${slug}`;
}

/** Human breadcrumb + hero labels per site. */
export const LEGACY_SITE_LABEL: Record<LegacySite, { section: string; sectionUrl: string; eyebrow: string; variant: "paris" | "sulphur" }> = {
  "massage-paris": {
    section: "Massage",
    sectionUrl: "/services/massage",
    eyebrow: "The Rub Club · Paris, TX",
    variant: "paris",
  },
  "chiro-paris": {
    section: "Chiropractic",
    sectionUrl: "/services/chiropractic",
    eyebrow: "Chiropractic Associates · Paris, TX",
    variant: "paris",
  },
  "chiro-sulphur": {
    section: "Sulphur Springs",
    sectionUrl: "/sulphur-springs",
    eyebrow: "Chiropractic Associates · Sulphur Springs",
    variant: "sulphur",
  },
};

function toLegacyPage(id: string, data: FirebaseFirestore.DocumentData): LegacyPage {
  const site = data.site as LegacySite;
  const slug = String(data.slug ?? "");
  return {
    id,
    site,
    slug,
    route: typeof data.route === "string" && data.route ? data.route : legacyRoute(site, slug),
    title: String(data.title ?? ""),
    metaTitle: String(data.metaTitle ?? data.title ?? ""),
    metaDescription: String(data.metaDescription ?? ""),
    blocks: Array.isArray(data.blocks) ? (data.blocks as LegacyBlock[]) : [],
    body: String(data.body ?? ""),
    contentHtmlUrl: String(data.contentHtmlUrl ?? ""),
    heroImage: String(data.heroImage ?? ""),
    images: Array.isArray(data.images) ? (data.images as LegacyImage[]) : [],
    order: typeof data.order === "number" ? data.order : 0,
    published: data.published === true,
    hasCuratedRoute: data.hasCuratedRoute === true,
    sourceUrl: String(data.sourceUrl ?? ""),
  };
}

/** Fetch a published legacy page by (site, slug), or null. */
export async function getPublishedLegacyPage(site: LegacySite, slug: string): Promise<LegacyPage | null> {
  const snap = await getFirestore()
    .collection(LEGACY_PAGES_COLLECTION)
    .doc(legacyDocId(site, slug))
    .get();
  if (!snap.exists) return null;
  const page = toLegacyPage(snap.id, snap.data() as FirebaseFirestore.DocumentData);
  return page.published ? page : null;
}

/** All published legacy pages for one site, ordered. */
export async function listPublishedLegacyPagesForSite(site: LegacySite): Promise<LegacyPage[]> {
  const snap = await getFirestore()
    .collection(LEGACY_PAGES_COLLECTION)
    .where("site", "==", site)
    .where("published", "==", true)
    .get();
  return snap.docs
    .map((d) => toLegacyPage(d.id, d.data()))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

/** All published legacy pages (for sitemap). */
export async function listAllPublishedLegacyPages(): Promise<LegacyPage[]> {
  const snap = await getFirestore()
    .collection(LEGACY_PAGES_COLLECTION)
    .where("published", "==", true)
    .get();
  return snap.docs
    .map((d) => toLegacyPage(d.id, d.data()))
    .sort((a, b) => a.route.localeCompare(b.route));
}

/** Every legacy page (admin listing — published or not). */
export async function listAllLegacyPages(): Promise<LegacyPage[]> {
  const snap = await getFirestore().collection(LEGACY_PAGES_COLLECTION).get();
  return snap.docs
    .map((d) => toLegacyPage(d.id, d.data()))
    .sort((a, b) => a.site.localeCompare(b.site) || a.order - b.order || a.slug.localeCompare(b.slug));
}
