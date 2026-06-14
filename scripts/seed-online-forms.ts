/**
 * Seeds the online patient forms config + legal text (skip if doc exists).
 * Run: npm run seed:online-forms
 *
 * Ships SAFE: the master switch (`_global`) is seeded as enabled:false, and every
 * legal block + termsHtml is seeded as a clearly-marked PLACEHOLDER. A superadmin
 * turns forms on and replaces the placeholder copy in Admin → Online Forms; this
 * script never overwrites an existing doc, so clinic edits are preserved on re-run.
 *
 * Loads `.env.local` via Next env (same as other scripts). Requires Firebase Admin credentials.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getFirestore } from "../lib/firebase-admin";
import {
  INTAKE_FORMS_CONFIG_COLLECTION,
  INTAKE_GLOBAL_DOC_ID,
  INTAKE_FORM_SEEDS,
  DEFAULT_INTRO_TEXT,
  DEFAULT_CONSENT_CHECKBOX_LABEL,
  DEFAULT_SUCCESS_MESSAGE,
  DEFAULT_DISABLED_MESSAGE,
  DEFAULT_TERMS_HTML,
} from "../lib/intakeForms/seed-config";
import {
  INTAKE_LEGAL_TEXT_COLLECTION,
  INTAKE_LEGAL_TEXT_SEEDS,
} from "../lib/intakeForms/legal-text";

async function main() {
  const db = getFirestore();
  const now = new Date();

  // Master switch — OFF by default.
  const globalRef = db.collection(INTAKE_FORMS_CONFIG_COLLECTION).doc(INTAKE_GLOBAL_DOC_ID);
  if ((await globalRef.get()).exists) {
    console.log("Skipped [_global] (exists)");
  } else {
    await globalRef.set({ enabled: false, updatedAt: now, updatedBy: "seed" });
    console.log("Created [_global] (enabled: false)");
  }

  // Per-form config docs.
  for (const form of INTAKE_FORM_SEEDS) {
    const ref = db.collection(INTAKE_FORMS_CONFIG_COLLECTION).doc(form.slug);
    if ((await ref.get()).exists) {
      console.log(`Skipped form [${form.slug}] (exists)`);
      continue;
    }
    await ref.set({
      slug: form.slug,
      title: form.title,
      enabled: false,
      order: form.order,
      introText: form.introText ?? DEFAULT_INTRO_TEXT,
      consentCheckboxLabel: DEFAULT_CONSENT_CHECKBOX_LABEL,
      termsHtml: DEFAULT_TERMS_HTML,
      successMessage: DEFAULT_SUCCESS_MESSAGE,
      disabledMessage: DEFAULT_DISABLED_MESSAGE,
      notifyEmails: [],
      updatedAt: now,
      updatedBy: "seed",
    });
    console.log(`Created form [${form.slug}]`);
  }

  // Editable legal / consent prose (placeholders).
  for (const block of INTAKE_LEGAL_TEXT_SEEDS) {
    const ref = db.collection(INTAKE_LEGAL_TEXT_COLLECTION).doc(block.cmsKey);
    if ((await ref.get()).exists) {
      console.log(`Skipped legal-text [${block.cmsKey}] (exists)`);
      continue;
    }
    await ref.set({
      cmsKey: block.cmsKey,
      label: block.label,
      body: block.body,
      updatedAt: now,
      updatedBy: "seed",
    });
    console.log(`Created legal-text [${block.cmsKey}]`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
