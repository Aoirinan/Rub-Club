/**
 * set-home-services-grid.ts  (CURSOR_PROMPT §4)
 *
 * Forces the home page "Our Services" grid to the three approved cards by
 * writing a Firestore override on practice_pages/paris-home.servicesGrid. This
 * is needed because an existing practice_pages doc (from prior admin edits)
 * would otherwise override the code default. Merge-write of a single field.
 *
 *   npx tsx scripts/set-home-services-grid.ts            # inspect current
 *   npx tsx scripts/set-home-services-grid.ts --commit   # write override
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "../lib/firebase-admin";
import { IMAGES } from "../lib/home-images";

const COMMIT = process.argv.includes("--commit");
const DOC = "paris-home";

const servicesGrid = {
  published: true,
  heading: "Our Services",
  intro: "",
  mode: "custom" as const,
  cards: [
    {
      name: "Chiropractic Care",
      blurb: "Adjustments, spinal decompression, and therapy from our Paris chiropractors.",
      imageUrl: IMAGES.massageChiroTile,
      href: "/services/chiropractic",
    },
    {
      name: "Stretch & Flex Rehab",
      blurb: "Assisted stretching and rehab movement to restore mobility and ease pain.",
      imageUrl: "/images/legacy/stretch-flex-gallery-1.webp",
      href: "/services/chiropractic/stretch-and-flex-rehab",
    },
    {
      name: "Massage",
      blurb: "Deep tissue, prenatal, sports, and relaxation massage at The Rub Club.",
      imageUrl: IMAGES.serviceDeepTissue,
      href: "/services/massage",
    },
  ],
};

async function main() {
  const db = getFirestore();
  const ref = db.collection("practice_pages").doc(DOC);
  const snap = await ref.get();
  const existing = snap.exists ? (snap.get("servicesGrid") as { cards?: unknown[] } | undefined) : undefined;
  console.log(`practice_pages/${DOC} exists: ${snap.exists}`);
  console.log(`current servicesGrid cards: ${existing?.cards?.length ?? "(none)"}`);

  if (!COMMIT) {
    console.log("\nDry run — re-run with --commit to write the 3-card override.");
    return;
  }

  await ref.set(
    { servicesGrid, updatedAt: FieldValue.serverTimestamp(), updatedBy: "legacy-migration-script" },
    { merge: true },
  );
  console.log("Wrote 3-card servicesGrid override.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
