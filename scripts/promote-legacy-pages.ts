/**
 * promote-legacy-pages.ts  (CURSOR_PROMPT.md §5)
 *
 * Promotes every content page from the `legacy_import` staging collection into
 * `legacyPages`, mapped 1:1 onto this repo's route conventions. ADDITIVE only —
 * never overwrites curated pages. Produces a reconciliation report so every line
 * of legacy-export/page-inventory.txt is accounted for.
 *
 *   npx tsx scripts/promote-legacy-pages.ts            # dry run + report
 *   npx tsx scripts/promote-legacy-pages.ts --commit   # write legacyPages
 *
 * Classification per doc:
 *   legacy   -> new verbatim page (published=true)
 *   curated  -> an existing curated route already owns this slug; kept for
 *               reference (published=false, hasCuratedRoute=true)
 *   utility  -> already has a canonical home elsewhere (contact, forms, about,
 *               staff, testimonials, faq...) — not a standalone legacy page
 *   skip     -> not a content page (sitemap, PDFs, widget iframes, index)
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import fs from "node:fs/promises";
import path from "node:path";
import { getFirestore } from "../lib/firebase-admin";
import { legacyRoute, type LegacySite } from "../lib/legacy-pages";
import { allParisChiroServiceSlugs } from "../lib/paris-chiro-services";
import { allSSPageSlugs } from "../lib/ss-cms-content";

const COMMIT = process.argv.includes("--commit");
const LEGACY_IMPORT = "legacy_import";
const LEGACY_PAGES = "legacyPages";
const EXPORT_DIR = "legacy-export";

type Kind = "legacy" | "curated" | "utility" | "skip";

/** Slugs that already have a canonical home on the new site (per site). */
const UTILITY_CANONICAL: Record<string, string> = {
  contact: "/contact",
  "contact-us": "/contact",
  "patient-forms": "/patient-forms",
  "new-patients": "/patient-forms",
  "patient-resources": "/patient-forms",
  about: "/about",
  "about-us": "/about",
  "about-chiro": "/services/chiropractic",
  services: "/services",
  links: "/faq",
  "educational-videos": "/",
  "exercise-videos": "/",
  staff: "/locations/paris/staff",
  "meet-the-doctor": "/about",
  "meet-the-staff": "/sulphur-springs/staff",
  testimonials: "/reviews",
  testimonials__page: "/reviews",
  "q-and-a": "/faq",
  "spinal-wellness-tips": "/faq",
  appointment: "/book",
  "appointment-request": "/book",
};

function isSkip(slug: string): boolean {
  return (
    slug === "index" ||
    slug === "sitemap" ||
    slug === "3d-spine-simulator" ||
    slug === "covid--19" ||
    slug.startsWith("plugins__") ||
    slug.startsWith("storage__") ||
    slug.startsWith("disclaimers__") ||
    slug.endsWith(".pdf")
  );
}

const IMAGE_RE = /\.(webp|jpe?g|png|gif|avif)$/i;
const LOGO_RE = /logo|favicon|sprite|icon/i;

function pickImages(assets: unknown): { url: string; alt: string; title: string }[] {
  if (!Array.isArray(assets)) return [];
  const seen = new Set<string>();
  const out: { url: string; alt: string; title: string }[] = [];
  for (const a of assets) {
    const url = typeof a?.url === "string" ? a.url : "";
    if (!url || !IMAGE_RE.test(url) || LOGO_RE.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, alt: String(a?.alt ?? ""), title: String(a?.title ?? "") });
  }
  return out;
}

function classify(site: LegacySite, slug: string, curatedParis: Set<string>, curatedSS: Set<string>): Kind {
  if (isSkip(slug)) return "skip";
  if (UTILITY_CANONICAL[slug]) return "utility";
  if (site === "chiro-paris" && curatedParis.has(slug)) return "curated";
  if (site === "chiro-sulphur" && curatedSS.has(slug)) return "curated";
  return "legacy";
}

async function main() {
  const db = getFirestore();
  const curatedParis = new Set(allParisChiroServiceSlugs());
  const curatedSS = new Set(allSSPageSlugs());

  const snap = await db.collection(LEGACY_IMPORT).get();
  console.log(`${COMMIT ? "COMMITTING" : "DRY RUN"} — ${snap.size} legacy_import docs\n`);

  const orderBySite: Record<string, number> = {};
  const report: string[] = [];
  const counts: Record<Kind, number> = { legacy: 0, curated: 0, utility: 0, skip: 0 };
  let written = 0;

  const rows = snap.docs
    .map((d) => ({ id: d.id, data: d.data() }))
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const { id, data } of rows) {
    const site = data.site as LegacySite;
    const slug = String(data.slug ?? "");
    const kind = classify(site, slug, curatedParis, curatedSS);
    counts[kind]++;

    const route = legacyRoute(site, slug);
    const canonical = kind === "utility" ? UTILITY_CANONICAL[slug] : kind === "curated" ? route : "";
    report.push(
      `${id}\t${kind}\t${kind === "legacy" || kind === "curated" ? route : canonical || "(none)"}`,
    );

    if (kind === "skip" || kind === "utility") continue;

    const images = pickImages(data.assets);
    orderBySite[site] = (orderBySite[site] ?? 0) + 10;

    const doc = {
      site,
      slug,
      route,
      title: String(data.title ?? ""),
      metaTitle: String(data.title ?? ""),
      metaDescription: String(data.metaDescription ?? ""),
      // VERBATIM render source + raw HTML for reference.
      blocks: Array.isArray(data.blocks) ? data.blocks : [],
      body: String(data.contentHtml ?? ""),
      contentHtmlUrl: String(data.contentHtmlUrl ?? ""),
      heroImage: images[0]?.url ?? "",
      images,
      order: orderBySite[site],
      published: kind === "legacy",
      hasCuratedRoute: kind === "curated",
      sourceUrl: String(data.sourceUrl ?? ""),
      promotedAt: new Date().toISOString(),
    };

    if (COMMIT) {
      await db.collection(LEGACY_PAGES).doc(id).set(doc, { merge: false });
      written++;
    }
    console.log(`  ${COMMIT ? "wrote" : "would write"}  ${LEGACY_PAGES}/${id}  [${kind}] -> ${route} (${images.length} imgs)`);
  }

  report.sort();
  await fs.mkdir(EXPORT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(EXPORT_DIR, "promotion-report.txt"),
    [
      `# legacy_import -> legacyPages reconciliation`,
      `# docId\tkind\troute-or-canonical`,
      ...report,
      ``,
      `# totals: legacy=${counts.legacy} curated=${counts.curated} utility=${counts.utility} skip=${counts.skip} (docs=${snap.size})`,
    ].join("\n"),
    "utf8",
  );

  console.log(
    `\ntotals: legacy=${counts.legacy} curated=${counts.curated} utility=${counts.utility} skip=${counts.skip}`,
  );
  console.log(`legacyPages written: ${written}`);
  console.log(`report -> ${path.join(EXPORT_DIR, "promotion-report.txt")}`);
  if (!COMMIT) console.log("\nRe-run with --commit to write.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
