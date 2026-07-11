/**
 * backfill-testimonial-locations.ts  (CURSOR_PROMPT §8b)
 *
 * Tags existing practice-page testimonials with a `location` so the location
 * filter (untagged = hidden) keeps showing the right reviews on each page:
 *
 *   practice_pages/paris-home/testimonials    -> location "paris"
 *   practice_pages/paris-chiro/testimonials   -> location "paris"
 *   practice_pages/sulphur-springs/testimonials -> location "sulphur-springs"
 *
 * Only sets `location` when missing (never overwrites an explicit tag).
 *
 *   npx tsx scripts/backfill-testimonial-locations.ts            # dry run
 *   npx tsx scripts/backfill-testimonial-locations.ts --commit   # write
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getFirestore } from "../lib/firebase-admin";

const COMMIT = process.argv.includes("--commit");

const LOCATION_BY_DOC: Record<string, "paris" | "sulphur-springs" | "massage"> = {
  "paris-home": "paris",
  "paris-chiro": "paris",
  "sulphur-springs": "sulphur-springs",
};

async function main() {
  const db = getFirestore();
  let updated = 0;
  for (const [docId, location] of Object.entries(LOCATION_BY_DOC)) {
    const col = db.collection("practice_pages").doc(docId).collection("testimonials");
    const snap = await col.get();
    for (const d of snap.docs) {
      const current = d.get("location");
      if (current === "paris" || current === "sulphur-springs" || current === "massage") continue;
      console.log(`  ${COMMIT ? "set" : "would set"} ${docId}/testimonials/${d.id} location=${location}`);
      if (COMMIT) {
        await d.ref.set({ location }, { merge: true });
        updated++;
      }
    }
  }
  console.log(`\n${COMMIT ? `updated: ${updated}` : "dry run — re-run with --commit"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
