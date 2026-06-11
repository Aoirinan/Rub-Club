/**
 * One-off backfill: fill empty `bio` fields in site_staff_members from the
 * code seed rosters (matched by member name). Never overwrites a non-empty bio.
 *
 * Usage (from repo root, same env as Next — e.g. `.env.local`):
 *   npx tsx scripts/backfill-site-staff-bios.ts
 */

import { loadEnvConfig } from "@next/env";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { SITE_STAFF_COLLECTION } from "@/lib/site-staff-data";
import { PARIS_OFFICE_STAFF_SEED, SS_STAFF_SEED } from "@/lib/site-staff-seed-rosters";

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());

  const seedBios = new Map<string, string>();
  for (const m of [...PARIS_OFFICE_STAFF_SEED, ...SS_STAFF_SEED]) {
    if (m.bio.trim()) seedBios.set(normalizeName(m.name), m.bio.trim());
  }

  const db = getFirestore();
  const snap = await db.collection(SITE_STAFF_COLLECTION).get();

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const name = typeof data.name === "string" ? data.name : "";
    const bio = typeof data.bio === "string" ? data.bio.trim() : "";
    if (bio) continue;
    const seedBio = seedBios.get(normalizeName(name));
    if (!seedBio) continue;
    await doc.ref.update({
      bio: seedBio,
      updatedAt: FieldValue.serverTimestamp(),
      updatedByUid: "backfill-script",
    });
    updated += 1;
    console.log(`[ok] Filled bio for "${name}" (${doc.id}), ${seedBio.length} chars`);
  }

  console.log(updated > 0 ? `\n[done] Updated ${updated} member(s).` : "\n[done] Nothing to update.");
}

void main().catch((e) => {
  console.error(e instanceof Error ? e.stack ?? e.message : e);
  process.exit(1);
});
