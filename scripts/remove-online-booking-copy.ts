/**
 * One-off cleanup: online booking is retired, so remove "online booking" /
 * "book online" wording from manager-saved CMS values and FAQ answers in
 * Firestore. Code defaults were already updated; this fixes stored overrides.
 *
 * Usage (from repo root, same env as Next — e.g. `.env.local`):
 *   npx tsx scripts/remove-online-booking-copy.ts
 */

import { loadEnvConfig } from "@next/env";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { SITE_CONTENT_COLLECTION } from "@/lib/cms";
import { SITE_FAQS_COLLECTION } from "@/lib/site-faqs";

const PHRASE_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  [/Use the online booking page to see live openings, or call the office/gi, "Call the office"],
  [/, hours, and online booking\./gi, ", and hours."],
  [/, and online booking\./gi, "."],
  [/ or book online below\./gi, " to schedule."],
  [/Book online or call/gi, "Call"],
  [/^Book Online$/i, "Book Now"],
];

function cleaned(value: string): string {
  let out = value;
  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

const MENTION = /online booking|book online/i;

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const db = getFirestore();
  let updated = 0;
  const leftovers: string[] = [];

  const contentSnap = await db.collection(SITE_CONTENT_COLLECTION).get();
  for (const doc of contentSnap.docs) {
    const value = doc.data().value;
    if (typeof value !== "string" || !MENTION.test(value)) continue;
    const next = cleaned(value);
    if (next === value) {
      leftovers.push(`site_content/${doc.id}: ${value.slice(0, 120)}`);
      continue;
    }
    await doc.ref.update({ value: next, updatedAt: FieldValue.serverTimestamp() });
    updated += 1;
    console.log(`[ok] site_content/${doc.id}\n  - ${value}\n  + ${next}`);
  }

  const faqSnap = await db.collection(SITE_FAQS_COLLECTION).get();
  for (const doc of faqSnap.docs) {
    const answer = doc.data().answer;
    if (typeof answer !== "string" || !MENTION.test(answer)) continue;
    const next = cleaned(answer);
    if (next === answer) {
      leftovers.push(`site_faqs/${doc.id}: ${answer.slice(0, 120)}`);
      continue;
    }
    await doc.ref.update({ answer: next, updatedAt: FieldValue.serverTimestamp() });
    updated += 1;
    console.log(`[ok] site_faqs/${doc.id}\n  - ${answer}\n  + ${next}`);
  }

  if (leftovers.length > 0) {
    console.log("\n[warn] Mentions needing manual review:");
    for (const l of leftovers) console.log(`  ${l}`);
  }
  console.log(updated > 0 ? `\n[done] Updated ${updated} document(s).` : "\n[done] Nothing to update.");
}

void main().catch((e) => {
  console.error(e instanceof Error ? e.stack ?? e.message : e);
  process.exit(1);
});
