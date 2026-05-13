// Delete the duplicate "Shely Cox" provider doc (II85hHSWowIyq71x1dEr).
// First verifies no bookings or slot_buckets reference it. Use --apply to actually delete.
//
// Usage:
//   node scripts/delete-duplicate-provider.mjs            (dry run)
//   node scripts/delete-duplicate-provider.mjs --apply    (actually delete)

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const txt = readFileSync(".env.local", "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      let val = m[2];
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = val;
    }
  } catch (e) {
    console.error("Failed to load .env.local:", e.message);
  }
}

const TARGET_ID = "II85hHSWowIyq71x1dEr";
const KEEP_ID = "3Yt9eqJW7qFjeG2OeyK5";
const APPLY = process.argv.includes("--apply");

const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(creds) });
const db = admin.firestore();

console.log(`\n=== Deleting duplicate provider doc ${TARGET_ID} (keeping ${KEEP_ID}) ===`);
console.log(`Mode: ${APPLY ? "APPLY (will write changes)" : "DRY RUN (no changes)"}\n`);

const targetSnap = await db.collection("providers").doc(TARGET_ID).get();
if (!targetSnap.exists) {
  console.log(`Target ${TARGET_ID} does not exist — nothing to do.`);
  process.exit(0);
}
const keepSnap = await db.collection("providers").doc(KEEP_ID).get();
if (!keepSnap.exists) {
  console.error(`SAFETY ABORT: keeper ${KEEP_ID} does not exist. Refusing to delete.`);
  process.exit(1);
}

console.log(`Target doc data: ${JSON.stringify(targetSnap.data())}`);
console.log(`Keeper doc data: ${JSON.stringify(keepSnap.data())}\n`);

const bookingsRef = await db.collection("bookings").where("providerId", "==", TARGET_ID).get();
console.log(`Bookings referencing ${TARGET_ID}: ${bookingsRef.size}`);
for (const d of bookingsRef.docs) {
  const b = d.data();
  console.log(`  • ${d.id} | status=${b.status} | startIso=${b.startIso}`);
}

const allBuckets = await db.collection("slot_buckets").get();
const targetBuckets = allBuckets.docs.filter((d) => d.data().providerId === TARGET_ID);
console.log(`\nslot_buckets referencing ${TARGET_ID}: ${targetBuckets.length}`);
for (const d of targetBuckets) {
  console.log(`  • ${d.id}`);
}

if (bookingsRef.size > 0 || targetBuckets.length > 0) {
  console.error(
    `\nSAFETY ABORT: target provider is referenced by bookings or buckets. ` +
      `Reassign or delete those first.`,
  );
  process.exit(1);
}

if (!APPLY) {
  console.log(`\nDry run complete. Re-run with --apply to delete ${TARGET_ID}.`);
  process.exit(0);
}

await db.collection("providers").doc(TARGET_ID).delete();
console.log(`\nDeleted providers/${TARGET_ID}.`);
process.exit(0);
