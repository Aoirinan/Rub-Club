/**
 * retag-ss-testimonials.ts
 *
 * One-shot fix: the Sulphur Springs auto-injury story was seeded into the
 * Paris practice-page testimonial subcollections and then blanket-tagged
 * location "paris" by backfill-testimonial-locations.ts, so it showed up on
 * the Paris home page. This retags it to "sulphur-springs" in:
 *
 *   practice_pages/paris-home/testimonials
 *   practice_pages/paris-chiro/testimonials
 *
 * (The copy under practice_pages/sulphur-springs is left untouched.) The
 * Paris pages filter with { location: "paris" }, so retagged rows disappear
 * from them immediately.
 *
 *   npx tsx scripts/retag-ss-testimonials.ts            # dry run
 *   npx tsx scripts/retag-ss-testimonials.ts --commit   # write
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getFirestore } from "../lib/firebase-admin";

const COMMIT = process.argv.includes("--commit");

const PARIS_DOCS = ["paris-home", "paris-chiro"] as const;

function isSulphurSpringsStory(name: unknown, quote: unknown): boolean {
  if (typeof name === "string" && /sulphur\s*springs/i.test(name)) return true;
  return (
    typeof quote === "string" &&
    /car accident I could barely turn my head/i.test(quote)
  );
}

async function main() {
  const db = getFirestore();
  let updated = 0;
  for (const docId of PARIS_DOCS) {
    const col = db.collection("practice_pages").doc(docId).collection("testimonials");
    const snap = await col.get();
    for (const d of snap.docs) {
      if (!isSulphurSpringsStory(d.get("name"), d.get("quote"))) continue;
      if (d.get("location") === "sulphur-springs") continue;
      console.log(
        `  ${COMMIT ? "set" : "would set"} ${docId}/testimonials/${d.id} location=sulphur-springs (name="${d.get("name")}")`,
      );
      if (COMMIT) {
        await d.ref.set({ location: "sulphur-springs" }, { merge: true });
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
