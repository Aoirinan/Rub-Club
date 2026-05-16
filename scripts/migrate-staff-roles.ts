/**
 * One-time migration: staff.role `admin` → `front_desk`.
 * Legacy read aliases remain in lib/staff-roles.ts until all docs are migrated.
 *
 * Usage:
 *   npx tsx scripts/migrate-staff-roles.ts          # dry run
 *   npx tsx scripts/migrate-staff-roles.ts --apply  # write changes
 */
import { getFirestore } from "../lib/firebase-admin";

async function main() {
  const apply = process.argv.includes("--apply");
  const db = getFirestore();
  const snap = await db.collection("staff").get();

  let adminCount = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const role = doc.get("role");
    if (role !== "admin") {
      skipped++;
      continue;
    }
    adminCount++;
    console.log(`${apply ? "UPDATE" : "WOULD UPDATE"} ${doc.id} (${doc.get("email") ?? "no email"}): admin → front_desk`);
    if (apply) {
      await doc.ref.update({ role: "front_desk" });
    }
  }

  console.log(`\nDone. ${adminCount} admin → front_desk, ${skipped} unchanged. Mode: ${apply ? "APPLIED" : "DRY RUN"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
