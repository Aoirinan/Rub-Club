/**
 * Seeds practice_pages/{paris-home|paris-chiro|sulphur-springs} with each
 * page's current live copy (CMS values + static fallbacks) plus testimonials:
 *   - Paris home: the 6 curated /reviews stories (published, with context)
 *   - Paris chiro: the 3 currently-live chiro testimonials (published) + 3 unpublished placeholders
 *   - Sulphur Springs: the SS auto-injury story (published) + 3 unpublished placeholders
 *
 * Existing docs are kept but upgraded in place when they still use the
 * pre-Phase-2 shape (single `about`/`team` maps instead of `aboutBlocks`/
 * `teamSections` arrays). Run: npm run seed:practice-pages
 * Loads `.env.local` via Next env. Requires Firebase Admin credentials.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getFirestore } from "../lib/firebase-admin";
import { getContentMany } from "../lib/cms";
import { TESTIMONIALS } from "../lib/testimonials";
import {
  PRACTICE_LOCATION_IDS,
  PRACTICE_PAGES_COLLECTION,
  PRACTICE_TESTIMONIALS_SUBCOLLECTION,
  PRACTICE_TESTIMONIAL_PLACEHOLDERS,
  buildPracticePageDefaults,
  mergePracticePageDoc,
  type PracticeLocationId,
} from "../lib/practice-pages";

type SeedTestimonial = {
  name: string;
  context: string;
  quote: string;
  order: number;
  published: boolean;
};

async function parisChiroLiveTestimonials(): Promise<SeedTestimonial[]> {
  const c = await getContentMany([
    "chiro_testimonial_1_text",
    "chiro_testimonial_1_attr",
    "chiro_testimonial_2_text",
    "chiro_testimonial_2_attr",
    "chiro_testimonial_3_text",
    "chiro_testimonial_3_attr",
  ]);
  const rows: SeedTestimonial[] = [];
  for (let i = 1; i <= 3; i++) {
    const quote = (c[`chiro_testimonial_${i}_text`] ?? "").trim();
    const name = (c[`chiro_testimonial_${i}_attr`] ?? "").trim();
    if (quote) rows.push({ name, context: "", quote, order: rows.length, published: true });
  }
  return rows;
}

/** The 6 curated /reviews stories (paraphrased Google reviews), published. */
function parisHomeTestimonials(): SeedTestimonial[] {
  return TESTIMONIALS.map((t, i) => ({
    name: t.author,
    context: t.context ?? "",
    quote: t.quote,
    order: i,
    published: true,
  }));
}

/** The SS auto-injury story from /reviews, published. */
function sulphurSpringsTestimonials(): SeedTestimonial[] {
  return TESTIMONIALS.filter((t) => /sulphur springs/i.test(t.author)).map((t, i) => ({
    name: t.author,
    context: t.context ?? "",
    quote: t.quote,
    order: i,
    published: true,
  }));
}

function liveTestimonialsFor(loc: PracticeLocationId): Promise<SeedTestimonial[]> {
  if (loc === "paris-home") return Promise.resolve(parisHomeTestimonials());
  if (loc === "sulphur-springs") return Promise.resolve(sulphurSpringsTestimonials());
  return parisChiroLiveTestimonials();
}

async function seedTestimonials(loc: PracticeLocationId): Promise<void> {
  const db = getFirestore();
  const col = db
    .collection(PRACTICE_PAGES_COLLECTION)
    .doc(loc)
    .collection(PRACTICE_TESTIMONIALS_SUBCOLLECTION);

  const existing = await col.limit(1).get();
  if (!existing.empty) {
    console.log(`Skipped testimonials [${loc}] (already present)`);
    return;
  }

  const live = await liveTestimonialsFor(loc);
  // The home page already shows 6 published stories — no placeholders needed.
  const placeholders: SeedTestimonial[] =
    loc === "paris-home"
      ? []
      : PRACTICE_TESTIMONIAL_PLACEHOLDERS.map((p, i) => ({
          name: p.name,
          context: "",
          quote: p.quote,
          order: live.length + i,
          published: false,
        }));

  for (const t of [...live, ...placeholders]) {
    await col.add({ ...t, updatedAt: new Date(), updatedBy: "seed" });
  }
  console.log(
    `Created ${live.length} live + ${placeholders.length} placeholder testimonials [${loc}]`,
  );
}

async function main() {
  const db = getFirestore();

  for (const loc of PRACTICE_LOCATION_IDS) {
    const ref = db.collection(PRACTICE_PAGES_COLLECTION).doc(loc);
    const snap = await ref.get();
    const defaults = await buildPracticePageDefaults(loc);
    if (!snap.exists) {
      await ref.set({ ...defaults, updatedAt: new Date(), updatedBy: "seed" });
      console.log(`Created [${loc}]`);
    } else {
      const data = snap.data() ?? {};
      const isLegacyShape = !Array.isArray(data.aboutBlocks) || !Array.isArray(data.teamSections);
      if (isLegacyShape) {
        // Upgrade in place: legacy single about/team maps fold into the arrays.
        const upgraded = mergePracticePageDoc(data, defaults);
        await ref.set({ ...upgraded, updatedAt: new Date(), updatedBy: "seed:upgrade" });
        console.log(`Upgraded [${loc}] to aboutBlocks/teamSections shape`);
      } else {
        console.log(`Skipped [${loc}] (exists)`);
      }
    }
    await seedTestimonials(loc);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
