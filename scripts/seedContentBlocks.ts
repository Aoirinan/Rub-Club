/**
 * Seeds site_content and site_faqs from lib/cms.ts defaults (skip if doc exists).
 * Run: npm run seed:content
 *
 * Loads `.env.local` via Next env (same as other scripts). Requires Firebase Admin credentials.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getFirestore } from "../lib/firebase-admin";
import {
  CONTENT_REGISTRY,
  DEFAULTS,
  SITE_CONTENT_COLLECTION,
} from "../lib/cms";
import { SITE_FAQS_COLLECTION, faqSeedDefaults } from "../lib/site-faqs";

async function main() {
  const db = getFirestore();

  for (const field of CONTENT_REGISTRY) {
    const ref = db.collection(SITE_CONTENT_COLLECTION).doc(field.id);
    const snap = await ref.get();
    if (snap.exists) {
      console.log(`Skipped [${field.id}] (exists)`);
      continue;
    }
    const value = DEFAULTS[field.id] ?? "";
    await ref.set({
      id: field.id,
      pageLabel: field.pageLabel,
      sectionLabel: field.sectionLabel,
      fieldLabel: field.fieldLabel,
      type: field.type,
      value,
      updatedAt: new Date(),
      updatedBy: "seed",
    });
    console.log(`Created [${field.id}]`);
  }

  for (const faq of faqSeedDefaults()) {
    const ref = db.collection(SITE_FAQS_COLLECTION).doc(faq.id);
    const snap = await ref.get();
    if (snap.exists) {
      console.log(`Skipped FAQ [${faq.id}] (exists)`);
      continue;
    }
    const { id: _id, ...data } = faq;
    await ref.set(data);
    console.log(`Created FAQ [${faq.id}]`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
