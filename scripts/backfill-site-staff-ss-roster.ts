/**
 * One-off backfill: align Sulphur Springs staff in Firestore with the legacy
 * meet-the-staff roster and local image paths.
 *
 * - Updates photoUrl for known SS seed members (by normalized name)
 * - Deactivates Leotta Cascia (not on legacy site)
 *
 * Usage (from repo root, same env as Next — e.g. `.env.local`):
 *   npx tsx scripts/backfill-site-staff-ss-roster.ts
 */

import { loadEnvConfig } from "@next/env";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { SITE_STAFF_COLLECTION } from "@/lib/site-staff-data";
import { SS_STAFF_SEED } from "@/lib/site-staff-seed-rosters";

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

const LEGACY_SS_NAMES = new Set(SS_STAFF_SEED.map((m) => normalizeName(m.name)));

const seedPhotos = new Map(
  SS_STAFF_SEED.filter((m) => m.image?.trim()).map((m) => [normalizeName(m.name), m.image!.trim()]),
);

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());

  const db = getFirestore();
  const snap = await db.collection(SITE_STAFF_COLLECTION).get();

  let photoUpdates = 0;
  let deactivated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const name = typeof data.name === "string" ? data.name : "";
    const brand = typeof data.brand === "string" ? data.brand.trim().toLowerCase() : "";
    if (brand !== "sulphur" && brand !== "both") continue;

    const normalized = normalizeName(name);

    if (!LEGACY_SS_NAMES.has(normalized)) {
      if (data.active !== false) {
        await doc.ref.update({
          active: false,
          updatedAt: FieldValue.serverTimestamp(),
          updatedByUid: "backfill-ss-roster",
        });
        deactivated += 1;
        console.log(`[deactivate] "${name}" — not on legacy SS roster`);
      }
      continue;
    }

    const seedPhoto = seedPhotos.get(normalized);
    if (!seedPhoto) continue;

    const currentPhoto = typeof data.photoUrl === "string" ? data.photoUrl.trim() : "";
    if (currentPhoto === seedPhoto) continue;

    await doc.ref.update({
      photoUrl: seedPhoto,
      updatedAt: FieldValue.serverTimestamp(),
      updatedByUid: "backfill-ss-roster",
    });
    photoUpdates += 1;
    console.log(`[photo] "${name}" → ${seedPhoto}`);
  }

  console.log(
    photoUpdates > 0 || deactivated > 0
      ? `\n[done] ${photoUpdates} photo(s) updated, ${deactivated} member(s) deactivated.`
      : "\n[done] Nothing to update.",
  );
}

void main().catch((e) => {
  console.error(e instanceof Error ? e.stack ?? e.message : e);
  process.exit(1);
});
