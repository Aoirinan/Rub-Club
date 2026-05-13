// E2E smoke: create a hold, verify slot_buckets, delete it, verify cleanup.
// Uses Admin SDK directly (bypasses HTTP layer / auth).
//
// Usage: node scripts/test-holds-roundtrip.mjs

import admin from "firebase-admin";
import { DateTime } from "luxon";
import { readFileSync } from "node:fs";

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
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
}

const TIME_ZONE = "America/Chicago";
const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(creds) });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

function holdBucketDocId(locationId, scope, start) {
  const z = start.setZone(TIME_ZONE);
  return `${locationId}__hold__${scope}__${z.toFormat("yyyy-LL-dd")}__${z.toFormat("HHmm")}`;
}
function holdBucketIdsForHold(locationId, scope, start, durationMin) {
  const z = start.setZone(TIME_ZONE).startOf("minute");
  const count = Math.max(1, Math.round(durationMin / 30));
  const slots = [];
  for (let i = 0; i < count; i++) slots.push(z.plus({ minutes: i * 30 }));
  return slots.map((s) => holdBucketDocId(locationId, scope, s));
}

const locationId = "paris";
const scope = "all";
const start = DateTime.fromISO("2099-12-31T11:00", { zone: TIME_ZONE });
const durationMin = 60;
const bucketIds = holdBucketIdsForHold(locationId, scope, start, durationMin);

console.log("Step 1 — pre-clean any prior test buckets...");
for (const id of bucketIds) {
  await db.collection("slot_buckets").doc(id).delete().catch(() => {});
}

console.log("\nStep 2 — create hold in transaction:");
const holdRef = db.collection("slot_holds").doc();
await db.runTransaction(async (tx) => {
  const bucketRefs = bucketIds.map((id) => db.collection("slot_buckets").doc(id));
  const snaps = await Promise.all(bucketRefs.map((r) => tx.get(r)));
  for (const s of snaps) {
    if (s.exists) throw new Error("bucket_conflict in test (should be empty)");
  }
  for (const ref of bucketRefs) {
    tx.set(ref, {
      holdId: holdRef.id,
      locationId,
      scope,
      startIso: start.toUTC().toISO(),
      durationMin,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  tx.set(holdRef, {
    locationId,
    scope,
    startIso: start.toUTC().toISO(),
    startAt: Timestamp.fromDate(start.toUTC().toJSDate()),
    endIso: start.plus({ minutes: durationMin }).toUTC().toISO(),
    endAt: Timestamp.fromDate(start.plus({ minutes: durationMin }).toUTC().toJSDate()),
    durationMin,
    note: "automated roundtrip test (delete safe)",
    bucketIds,
    createdByUid: "test_script",
    createdByEmail: null,
    createdAt: FieldValue.serverTimestamp(),
  });
});
console.log("  Hold id:", holdRef.id);
console.log("  Wrote bucket ids:");
for (const id of bucketIds) console.log("   ", id);

console.log("\nStep 3 — verify buckets exist:");
for (const id of bucketIds) {
  const snap = await db.collection("slot_buckets").doc(id).get();
  console.log(`  ${id} exists=${snap.exists}`);
}

console.log("\nStep 4 — verify conflict: writing the same hold again should reject.");
let conflicted = false;
try {
  await db.runTransaction(async (tx) => {
    const bucketRefs = bucketIds.map((id) => db.collection("slot_buckets").doc(id));
    const snaps = await Promise.all(bucketRefs.map((r) => tx.get(r)));
    for (const s of snaps) {
      if (s.exists) throw new Error("bucket_conflict");
    }
  });
} catch (e) {
  conflicted = e.message === "bucket_conflict";
}
console.log("  conflict detected:", conflicted);

console.log("\nStep 5 — delete hold + buckets in transaction:");
await db.runTransaction(async (tx) => {
  const snap = await tx.get(holdRef);
  if (!snap.exists) throw new Error("not_found");
  const data = snap.data();
  for (const id of data.bucketIds ?? []) {
    tx.delete(db.collection("slot_buckets").doc(id));
  }
  tx.delete(holdRef);
});
console.log("  Deleted hold and its buckets.");

console.log("\nStep 6 — verify cleanup:");
for (const id of bucketIds) {
  const snap = await db.collection("slot_buckets").doc(id).get();
  console.log(`  ${id} exists=${snap.exists}`);
}
const finalHold = await holdRef.get();
console.log(`  hold ${holdRef.id} exists=${finalHold.exists}`);

console.log("\nAll roundtrip steps completed.");
process.exit(0);
