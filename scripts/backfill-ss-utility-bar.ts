/**
 * One-off backfill: align Sulphur Springs utility bar phones + social with Paris.
 *
 * Usage (from repo root, same env as Next — e.g. `.env.local`):
 *   npx tsx scripts/backfill-ss-utility-bar.ts
 */

import { loadEnvConfig } from "@next/env";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import {
  PRACTICE_PAGES_COLLECTION,
  buildPracticePageDefaults,
  mergePracticePageDoc,
} from "@/lib/practice-pages";

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());

  const defaults = await buildPracticePageDefaults("sulphur-springs");
  const db = getFirestore();
  const ref = db.collection(PRACTICE_PAGES_COLLECTION).doc("sulphur-springs");
  const snap = await ref.get();

  const merged = mergePracticePageDoc(snap.data(), defaults);
  const nextUtilityBar = {
    ...merged.utilityBar,
    phones: defaults.utilityBar.phones,
    socialLinks: defaults.utilityBar.socialLinks,
  };

  await ref.set(
    {
      utilityBar: nextUtilityBar,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.log(
    `[done] Updated sulphur-springs utility bar: ${nextUtilityBar.phones.length} phone(s), ${nextUtilityBar.socialLinks.length} social link(s).`,
  );
}

void main().catch((e) => {
  console.error(e instanceof Error ? e.stack ?? e.message : e);
  process.exit(1);
});
