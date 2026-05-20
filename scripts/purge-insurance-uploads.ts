/**
 * One-time cleanup: removes every trace of historical insurance-information
 * uploads from Firebase Storage and Firestore.
 *
 * Run:
 *   npm run purge:insurance-uploads
 *
 * Flags:
 *   --drop-intake-forms      Also delete every doc in the `intake_forms`
 *                            collection (and its `phi_access_log` subcollection).
 *                            Default: false.
 *   --dry-run                Log what would be deleted; do not delete.
 *
 * Safe to run multiple times (idempotent).
 *
 * What it does:
 *   1. Deletes Cloud Storage objects under
 *        patients/<id>/insurance_front.<ext>
 *        patients/<id>/insurance_back.<ext>
 *        intake_documents/**
 *   2. For every doc in `patients/*`: removes the fields
 *        insuranceCardFront, insuranceCardBack
 *   3. (Optional, --drop-intake-forms) Deletes every doc in `intake_forms`
 *      along with its `phi_access_log` subcollection documents.
 *
 * Loads `.env.local` via Next env (same pattern as scripts/seedContentBlocks.ts).
 * Requires Firebase Admin credentials. Does NOT run automatically.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { FieldValue } from "firebase-admin/firestore";
import { getFirestore, getStorageBucket } from "../lib/firebase-admin";

type Counts = {
  storageObjectsDeleted: number;
  patientDocsCleared: number;
  intakeFormDocsDeleted: number;
  phiAccessLogDocsDeleted: number;
};

function parseArgs(argv: string[]): { dropIntakeForms: boolean; dryRun: boolean } {
  return {
    dropIntakeForms: argv.includes("--drop-intake-forms"),
    dryRun: argv.includes("--dry-run"),
  };
}

async function purgeStoragePrefix(prefix: string, dryRun: boolean): Promise<number> {
  const bucket = getStorageBucket();
  const [files] = await bucket.getFiles({ prefix });
  if (files.length === 0) {
    console.log(`[storage] no objects under ${prefix}`);
    return 0;
  }
  console.log(`[storage] found ${files.length} object(s) under ${prefix}`);
  if (dryRun) {
    for (const f of files) console.log(`  would delete ${f.name}`);
    return files.length;
  }
  let deleted = 0;
  for (const file of files) {
    try {
      await file.delete({ ignoreNotFound: true });
      console.log(`  deleted ${file.name}`);
      deleted++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  failed ${file.name}: ${msg}`);
    }
  }
  return deleted;
}

async function purgePatientInsuranceCardUrls(dryRun: boolean): Promise<number> {
  const db = getFirestore();
  const snap = await db.collection("patients").get();
  let cleared = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const hasFront = typeof data.insuranceCardFront !== "undefined";
    const hasBack = typeof data.insuranceCardBack !== "undefined";
    if (!hasFront && !hasBack) continue;
    if (dryRun) {
      console.log(`[firestore] would clear patient ${doc.id} (front=${hasFront} back=${hasBack})`);
      cleared++;
      continue;
    }
    await doc.ref.update({
      insuranceCardFront: FieldValue.delete(),
      insuranceCardBack: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`[firestore] cleared patient ${doc.id}`);
    cleared++;
  }
  if (cleared === 0) {
    console.log("[firestore] no patient docs had insurance card URL fields");
  }
  return cleared;
}

async function purgeIntakeForms(dryRun: boolean): Promise<{ docs: number; logs: number }> {
  const db = getFirestore();
  const snap = await db.collection("intake_forms").get();
  if (snap.empty) {
    console.log("[firestore] intake_forms collection is empty");
    return { docs: 0, logs: 0 };
  }
  let docs = 0;
  let logs = 0;
  for (const doc of snap.docs) {
    const logSnap = await doc.ref.collection("phi_access_log").get();
    for (const logDoc of logSnap.docs) {
      if (dryRun) {
        console.log(`[firestore] would delete intake_forms/${doc.id}/phi_access_log/${logDoc.id}`);
      } else {
        await logDoc.ref.delete();
      }
      logs++;
    }
    if (dryRun) {
      console.log(`[firestore] would delete intake_forms/${doc.id}`);
    } else {
      await doc.ref.delete();
      console.log(`[firestore] deleted intake_forms/${doc.id}`);
    }
    docs++;
  }
  return { docs, logs };
}

async function listPatientInsurancePrefixes(): Promise<string[]> {
  const bucket = getStorageBucket();
  const [files] = await bucket.getFiles({ prefix: "patients/" });
  const set = new Set<string>();
  for (const f of files) {
    const m = f.name.match(/^patients\/([^/]+)\/insurance_(front|back)\./);
    if (m) set.add(`patients/${m[1]}/insurance_`);
  }
  return [...set];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log("purge-insurance-uploads starting", args);

  const counts: Counts = {
    storageObjectsDeleted: 0,
    patientDocsCleared: 0,
    intakeFormDocsDeleted: 0,
    phiAccessLogDocsDeleted: 0,
  };

  const patientPrefixes = await listPatientInsurancePrefixes();
  for (const prefix of patientPrefixes) {
    counts.storageObjectsDeleted += await purgeStoragePrefix(prefix, args.dryRun);
  }
  counts.storageObjectsDeleted += await purgeStoragePrefix("intake_documents/", args.dryRun);

  counts.patientDocsCleared = await purgePatientInsuranceCardUrls(args.dryRun);

  if (args.dropIntakeForms) {
    const { docs, logs } = await purgeIntakeForms(args.dryRun);
    counts.intakeFormDocsDeleted = docs;
    counts.phiAccessLogDocsDeleted = logs;
  } else {
    console.log("[firestore] skipping intake_forms collection (pass --drop-intake-forms to remove)");
  }

  console.log("\npurge-insurance-uploads done", counts);
  if (args.dryRun) console.log("(dry-run: nothing was actually deleted)");
}

void main().catch((err) => {
  console.error("purge-insurance-uploads failed", err);
  process.exit(1);
});
