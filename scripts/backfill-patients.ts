/**
 * Link historical bookings to patient records and optionally recompute patient stats.
 *
 * Usage (from repo root, Firebase Admin env configured):
 *   npm run backfill:patients
 *   npm run backfill:patients -- --dry-run
 *   npm run backfill:patients -- --no-recalc-stats
 *   npm run backfill:patients -- --limit=500
 *
 * Stats are recomputed from linked bookings by default (recommended after bulk link).
 */

import { loadEnvConfig } from "@next/env";
import { getFirestore } from "@/lib/firebase-admin";
import {
  inferBookingPatientSource,
  linkBookingToPatient,
  PATIENTS_COLLECTION,
  recalculatePatientStats,
} from "@/lib/patients-db";

type Flags = {
  dryRun: boolean;
  recalcStats: boolean;
  limit: number | null;
};

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { dryRun: false, recalcStats: true, limit: null };
  for (const arg of argv) {
    if (arg === "--dry-run") flags.dryRun = true;
    else if (arg === "--no-recalc-stats") flags.recalcStats = false;
    else if (arg.startsWith("--limit=")) {
      const n = Number(arg.slice("--limit=".length));
      if (Number.isFinite(n) && n > 0) flags.limit = Math.trunc(n);
    }
  }
  return flags;
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  loadEnvConfig(process.cwd());

  const db = getFirestore();
  const snap = await db.collection("bookings").get();

  let scanned = 0;
  let linked = 0;
  let skippedHasPatient = 0;
  let skippedNoPhone = 0;
  let errors = 0;
  const touchedPatientIds = new Set<string>();

  for (const doc of snap.docs) {
    if (flags.limit !== null && scanned >= flags.limit) break;
    scanned++;

    const data = doc.data();
    const existing =
      typeof data.patientId === "string" && data.patientId.trim() ? data.patientId.trim() : "";
    if (existing) {
      skippedHasPatient++;
      if (flags.recalcStats) touchedPatientIds.add(existing);
      continue;
    }

    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const name = typeof data.name === "string" ? data.name.trim() : "";
    if (!phone || !name) {
      skippedNoPhone++;
      continue;
    }

    if (flags.dryRun) {
      linked++;
      continue;
    }

    try {
      const source = inferBookingPatientSource(data);
      await linkBookingToPatient(db, doc.ref, data, source, { bumpStats: false });
      const fresh = await doc.ref.get();
      const pid = fresh.get("patientId");
      if (typeof pid === "string" && pid) touchedPatientIds.add(pid);
      linked++;
    } catch (e) {
      errors++;
      console.error(`[error] booking ${doc.id}:`, e instanceof Error ? e.message : e);
    }
  }

  if (flags.recalcStats && !flags.dryRun) {
    const patientSnap = await db.collection(PATIENTS_COLLECTION).get();
    for (const p of patientSnap.docs) {
      if (p.get("deleted") === true) continue;
      touchedPatientIds.add(p.id);
    }
    console.log(`[info] Recalculating stats for ${touchedPatientIds.size} patient(s)…`);
    for (const patientId of touchedPatientIds) {
      try {
        await recalculatePatientStats(db, patientId);
      } catch (e) {
        errors++;
        console.error(`[error] stats ${patientId}:`, e instanceof Error ? e.message : e);
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun: flags.dryRun,
        recalcStats: flags.recalcStats && !flags.dryRun,
        scanned,
        linked,
        skippedHasPatient,
        skippedNoPhone,
        errors,
        patientsRecalculated: flags.recalcStats && !flags.dryRun ? touchedPatientIds.size : 0,
      },
      null,
      2,
    ),
  );

  if (errors > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
