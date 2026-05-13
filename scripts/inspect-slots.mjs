// Diagnostic: list providers, bookings, and slot_buckets for a given date.
// Usage: node scripts/inspect-slots.mjs [yyyy-MM-dd] [locationId]
// Defaults: today (Chicago) and "paris"

import admin from "firebase-admin";
import { DateTime } from "luxon";
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

const TIME_ZONE = "America/Chicago";

const dateStr = process.argv[2] || DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd");
const locationId = process.argv[3] || "paris";

const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(creds) });
const db = admin.firestore();

console.log(`\n=== Diagnostic for ${locationId} on ${dateStr} (${TIME_ZONE}) ===\n`);

// 1) Providers
const provSnap = await db.collection("providers").get();
console.log(`Providers collection — total docs: ${provSnap.size}`);
const providers = [];
for (const d of provSnap.docs) {
  const data = d.data();
  providers.push({ id: d.id, ...data });
}
for (const p of providers) {
  console.log(
    `  • ${p.id} | "${p.displayName}" | active=${p.active} | locations=${JSON.stringify(p.locationIds)} | services=${JSON.stringify(p.serviceLines)} | schedule=${JSON.stringify(p.schedule ?? null)}`,
  );
}

const eligibleParisMassage = providers.filter(
  (p) =>
    p.active === true &&
    Array.isArray(p.locationIds) &&
    p.locationIds.includes(locationId) &&
    Array.isArray(p.serviceLines) &&
    p.serviceLines.includes("massage"),
);
console.log(
  `\nEligible for ${locationId} / massage: ${eligibleParisMassage.length} ` +
    `(${eligibleParisMassage.map((p) => p.displayName).join(", ") || "none"})`,
);

// 2) Bookings on that date
const dayStart = DateTime.fromISO(dateStr, { zone: TIME_ZONE }).startOf("day");
const dayEnd = dayStart.plus({ days: 1 });

const bookSnap = await db
  .collection("bookings")
  .where("startAt", ">=", admin.firestore.Timestamp.fromDate(dayStart.toUTC().toJSDate()))
  .where("startAt", "<", admin.firestore.Timestamp.fromDate(dayEnd.toUTC().toJSDate()))
  .get();

console.log(`\nBookings on ${dateStr}: ${bookSnap.size}`);
for (const d of bookSnap.docs) {
  const b = d.data();
  const startCt = b.startAt
    ? DateTime.fromJSDate(b.startAt.toDate()).setZone(TIME_ZONE).toFormat("h:mm a")
    : "(no startAt)";
  console.log(
    `  • ${d.id} | ${startCt} | loc=${b.locationId} | ${b.serviceLine} | ${b.durationMin}m | provider=${b.providerDisplayName ?? "(unassigned)"} (${b.providerId ?? "—"}) | status=${b.status} | buckets=${JSON.stringify(b.bucketIds ?? [])}`,
  );
}

// 3) slot_buckets for that location
console.log(`\nslot_buckets (filtered by id prefix "${locationId}__" and date ${dateStr}):`);
const bucketSnap = await db.collection("slot_buckets").get();
const dateSegment = dateStr;
let bucketCount = 0;
for (const d of bucketSnap.docs) {
  if (!d.id.startsWith(`${locationId}__`)) continue;
  if (!d.id.includes(`__${dateSegment}__`)) continue;
  bucketCount++;
  const data = d.data();
  console.log(
    `  • ${d.id} | bookingId=${data.bookingId} | provider=${data.providerId} | ${data.serviceLine}/${data.durationMin}m`,
  );
}
console.log(`(${bucketCount} matching buckets total)`);

console.log("\n=== End diagnostic ===\n");
process.exit(0);
