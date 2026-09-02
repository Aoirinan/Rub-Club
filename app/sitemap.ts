import type { MetadataRoute } from "next";
import { allParisChiroServiceSlugs } from "@/lib/paris-chiro-services";
import { getSiteOrigin } from "@/lib/site-content";
import { listAllPublishedLegacyPages } from "@/lib/legacy-pages";
import { allSSPageSlugs } from "@/lib/ss-cms-content";
import { SS_RESOURCE_ARTICLES } from "@/lib/sulphur-springs-content";

export const revalidate = 3600;

/**
 * Stable lastModified: the deploy time, not the request time. Stamping every
 * URL with "now" on each regeneration makes crawlers ignore the field.
 */
const BUILD_LAST_MODIFIED = new Date();

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const ENTRIES: { path: string; changeFrequency: ChangeFrequency; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/book", changeFrequency: "weekly", priority: 0.95 },
  { path: "/services", changeFrequency: "monthly", priority: 0.88 },
  // NOTE: /chiropractic, /massage, /meet-the-doctors, /locations are 301 redirects
  // (see next.config.ts) and are intentionally excluded — sitemaps should list only
  // canonical 200 URLs. Their targets (/services/*, /about, /contact) are below.
  { path: "/services/chiropractic", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/chiropractic/wellness-care-plans", changeFrequency: "monthly", priority: 0.8 },
  ...allParisChiroServiceSlugs().map((slug) => ({
    path: `/services/chiropractic/${slug}`,
    changeFrequency: "monthly" as ChangeFrequency,
    priority: 0.6,
  })),
  { path: "/services/massage", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/massage/prices", changeFrequency: "monthly", priority: 0.6 },
  { path: "/locations/paris", changeFrequency: "monthly", priority: 0.82 },
  { path: "/locations/paris/staff", changeFrequency: "monthly", priority: 0.7 },
  { path: "/locations/sulphur-springs", changeFrequency: "monthly", priority: 0.82 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.75 },
  { path: "/about", changeFrequency: "monthly", priority: 0.65 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.65 },
  { path: "/insurance", changeFrequency: "monthly", priority: 0.55 },
  { path: "/reviews", changeFrequency: "monthly", priority: 0.55 },
  { path: "/patient-forms", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.45 },
  { path: "/website-privacy", changeFrequency: "yearly", priority: 0.42 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.42 },
  { path: "/sulphur-springs", changeFrequency: "monthly", priority: 0.8 },
  { path: "/sulphur-springs/massage", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sulphur-springs/massage/prices", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/wellness-care-plans", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sulphur-springs/staff", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sulphur-springs/contact", changeFrequency: "monthly", priority: 0.7 },
  // Every SS service / injury / resource slug rendered by app/sulphur-springs/[slug].
  ...allSSPageSlugs().map((slug) => ({
    path: `/sulphur-springs/${slug}`,
    changeFrequency: "monthly" as ChangeFrequency,
    priority: SS_RESOURCE_ARTICLES.some((a) => a.slug === slug) ? 0.55 : 0.6,
  })),
  { path: "/sulphur-springs/patient-resources", changeFrequency: "monthly", priority: 0.55 },
  { path: "/sulphur-springs/q-and-a", changeFrequency: "monthly", priority: 0.55 },
  { path: "/sulphur-springs/insurance", changeFrequency: "monthly", priority: 0.55 },
  { path: "/sulphur-springs/reviews", changeFrequency: "monthly", priority: 0.55 },
  { path: "/sulphur-springs/patient-forms", changeFrequency: "yearly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const lastModified = BUILD_LAST_MODIFIED;

  const seen = new Set<string>();
  const staticEntries = ENTRIES.filter((e) => {
    if (seen.has(e.path)) return false;
    seen.add(e.path);
    return true;
  }).map((e) => ({
    url: `${origin}${e.path}`,
    lastModified,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));

  // Every published legacy page is a canonical 200 route (CURSOR_PROMPT §5).
  const known = new Set(ENTRIES.map((e) => e.path));
  let legacyEntries: MetadataRoute.Sitemap = [];
  try {
    const legacyPages = await listAllPublishedLegacyPages();
    legacyEntries = legacyPages
      .filter((p) => !known.has(p.route))
      .map((p) => ({
        url: `${origin}${p.route}`,
        lastModified,
        changeFrequency: "monthly" as ChangeFrequency,
        priority: 0.5,
      }));
  } catch {
    // Firestore unavailable at build — static entries still ship.
  }

  return [...staticEntries, ...legacyEntries];
}
