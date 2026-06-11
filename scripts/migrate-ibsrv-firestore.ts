/**
 * Phase 0 asset rescue (Firestore side): finds every string containing
 * "ibsrv.net" in site-content collections and rewrites known legacy CDN URLs
 * to their self-hosted /public paths (downloaded by download-ibsrv-assets.mjs).
 *
 * Dry run (report only):  npx tsx scripts/migrate-ibsrv-firestore.ts
 * Apply replacements:     npx tsx scripts/migrate-ibsrv-firestore.ts --apply
 *
 * PHI / operational collections are skipped entirely, as are append-only audit
 * logs (content_change_log has ~90k entries; historical values there are never
 * served to the site and must not be rewritten).
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getFirestore } from "../lib/firebase-admin";
import type { firestore } from "firebase-admin";

const SKIP_COLLECTIONS = new Set([
  "bookings",
  "patients",
  "sms_send_log",
  "rate_limits",
  "slot_buckets",
  "notifications_log",
  "contact_submissions",
  "content_change_log",
]);

const LOG_COLLECTIONS = new Set<string>([]);

const URL_MAP: Record<string, string> = {
  "https://cdcssl.ibsrv.net/ibimg/smb/768x156_80/webmgr/1w/3/z/ple/RC-logo2.png.webp?2d7b966d7ecb9dae0791ca79bceae7b8":
    "/logos/rub-club.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/768x90_80/webmgr/1x/5/c/sedona/logo1_g2b15gukTcuMWaVGgkCA-566x161-377w.png.webp?9937e103856e4c581bdc303dc0e48633":
    "/images/legacy/chiro-logo-legacy.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x743_80/webmgr/1w/3/z/ple/63852b80b3bf1_banner.jpg.webp?71daea4ffd896824b25fbde605a9ea06":
    "/images/legacy/massage-hero-banner.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x933_80/webmgr/1w/3/z/ple/shutterstock_1184775688-ed.jpg.webp?8559b7dd5203b55a0948674df741e14c":
    "/images/legacy/massage-patient.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x990_80/webmgr/1w/3/z/ple/shutterstock_336945686.jpg.webp?3f41a60baebc9b6209258b4e72b3b21c":
    "/images/legacy/service-deep-tissue.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x934_80/webmgr/1w/3/z/ple/shutterstock_1729514116.jpg.webp?b1c3bc3c658cca01290563c23e62c80c":
    "/images/legacy/service-prenatal.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x934_80/webmgr/1w/3/z/ple/shutterstock_222620296.jpg.webp?a1f06e92b4c31d8c39aa11d2e138128a":
    "/images/legacy/service-sports.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x934_80/webmgr/1w/3/z/ple/638660a05d69e_chirobg.jpg.webp?20e761e45f85550c3bd062f087af0e56":
    "/images/legacy/massage-chiro-tile.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x1227_80/webmgr/1x/5/c/sedona/637d483367b61_blade.jpg.webp?f4d8fdfeaf0d5752ef0b4d328a1456af":
    "/images/legacy/chiro-blade.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x934_80/webmgr/1x/5/c/sedona/638660a05d69e_chirobg.jpg.webp?20e761e45f85550c3bd062f087af0e56":
    "/images/legacy/chiro-bg.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/250x296_80/webmgr/1x/5/c/sedona/Dr-250x296.-Greg-Thompson-1920w.webp?7be6bcf9f8af51aa716aff29d066121d":
    "/images/legacy/doctor-greg-thompson.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1920x1993_80/webmgr/1x/5/c/sedona/sean2final-1920w.webp?14427f86ae1f71f52d35834b8d7a0195":
    "/images/legacy/doctor-sean-welborn.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1200x1482_80/webmgr/1x/5/c/698df4a633adc_Dr.Collins.jpeg.webp?f3e9f996a1d80fb97573bee51fa2c869":
    "/images/legacy/doctor-brandy-collins.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/682x1024_80/webmgr/1w/3/z/ple/f994bdb5-2a4c-45e3-8331-6585720ff52d-1920w.webp?6f4e5067834f149e96e335b2ad8f1a58":
    "/images/legacy/staff-ana.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1541x2117_80/webmgr/1w/3/z/ple/Shely-2cae328b-1920w_20230228_1811.webp?5cbfb54c7177077c5ab8b679898f1b1a":
    "/images/legacy/staff-shely.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/2099x2355_80/webmgr/1w/3/z/CoCo.jpeg.webp?ff4756b45c7390013bd8af5700d17629":
    "/images/legacy/staff-rosylin.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/891x1153_80/webmgr/1w/3/z/ChanChan.png.webp?60497041700f4e83050dd4dc86fe5310":
    "/images/legacy/staff-channety.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/180x250_80/webmgr/1w/3/z/ple/Brandi-180x250-1920w.webp?2da61b33eec483b193df9e654b834a4a":
    "/images/legacy/staff-brandi.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/64415168a80ed_Brandi.webp?2da61b33eec483b193df9e654b834a4a":
    "/images/legacy/paris-staff-brandi-boren.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/sedona/sarah.webp?063dba69995f266776ec043011697d24":
    "/images/legacy/paris-staff-sarah-brown.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/667da401c4fc8_ShaunaClark.jpg.webp?5b900f40d9a2ff0118b390d0a00952d1":
    "/images/legacy/paris-staff-shauna-clark.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/shelbie-2_20251120_2115.png.webp?7f935098ccbbcf441a399c19e077443a":
    "/images/legacy/paris-staff-shelbie-guthrie.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/sedona/Ashlie-fd8e2220-2880w.webp?cdc5cab1a87c66c94bd9929247447797":
    "/images/legacy/paris-staff-ashlie-jenkins.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/CHANN_20250220_1843.png.webp?ba181c242dc69fe0d7ca86fd954f35ae":
    "/images/legacy/paris-staff-channety-wooten.webp",
};

const APPLY = process.argv.includes("--apply");

type Finding = { docPath: string; fieldPath: string; value: string; mapped: boolean; isLog: boolean };
const findings: Finding[] = [];

function replaceString(s: string): string {
  let out = s;
  for (const [from, to] of Object.entries(URL_MAP)) {
    out = out.split(from).join(to);
  }
  return out;
}

/** Recursively transform a Firestore value; record findings; return [newValue, changed]. */
function transform(value: unknown, docPath: string, fieldPath: string, isLog: boolean): [unknown, boolean] {
  if (typeof value === "string") {
    if (value.includes("ibsrv.net")) {
      const replaced = replaceString(value);
      const mapped = !replaced.includes("ibsrv.net");
      findings.push({ docPath, fieldPath, value, mapped, isLog });
      return [replaced, replaced !== value];
    }
    return [value, false];
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((v, i) => {
      const [nv, c] = transform(v, docPath, `${fieldPath}[${i}]`, isLog);
      if (c) changed = true;
      return nv;
    });
    return [changed ? next : value, changed];
  }
  // Plain maps only — leave Timestamp/GeoPoint/Reference/Buffer untouched.
  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const [nv, c] = transform(v, docPath, fieldPath ? `${fieldPath}.${k}` : k, isLog);
      if (c) changed = true;
      next[k] = nv;
    }
    return [changed ? next : value, changed];
  }
  return [value, false];
}

async function scanCollection(col: firestore.CollectionReference, rootName: string): Promise<number> {
  let updated = 0;
  let seen = 0;
  const isLog = LOG_COLLECTIONS.has(rootName);
  // Stream instead of one .get() so huge collections don't buffer in memory.
  for await (const docSnap of col.stream() as AsyncIterable<firestore.QueryDocumentSnapshot>) {
    seen++;
    if (seen % 500 === 0) console.log(`  ...${col.path}: ${seen} docs scanned`);
    const [next, changed] = transform(docSnap.data(), docSnap.ref.path, "", isLog);
    if (changed && APPLY && !isLog) {
      await docSnap.ref.set(next as FirebaseFirestore.DocumentData);
      updated++;
      console.log(`[updated] ${docSnap.ref.path}`);
    }
    // Per-doc subcollection listing is one round trip per doc — skip it for
    // large append-only log collections, which never have subcollections.
    if (!isLog) {
      for (const sub of await docSnap.ref.listCollections()) {
        updated += await scanCollection(sub, rootName);
      }
    }
  }
  console.log(`  [done] ${col.path}: ${seen} docs`);
  return updated;
}

async function main() {
  const db = getFirestore();
  const roots = await db.listCollections();
  let updated = 0;
  for (const col of roots) {
    if (SKIP_COLLECTIONS.has(col.id)) {
      console.log(`[skip] ${col.id} (PHI/operational)`);
      continue;
    }
    console.log(`[scan] ${col.id}`);
    updated += await scanCollection(col, col.id);
  }

  console.log(`\n=== ${findings.length} ibsrv.net occurrence(s) found ===`);
  for (const f of findings) {
    const tag = f.isLog ? "LOG-ONLY" : f.mapped ? "mapped" : "UNMAPPED";
    console.log(`[${tag}] ${f.docPath} :: ${f.fieldPath}\n    ${f.value.slice(0, 160)}`);
  }
  const unmapped = findings.filter((f) => !f.mapped && !f.isLog);
  if (unmapped.length) {
    console.log(`\nWARNING: ${unmapped.length} occurrence(s) have no replacement in URL_MAP — add them and re-run.`);
    process.exit(2);
  }
  console.log(APPLY ? `\nApplied: ${updated} doc(s) rewritten.` : "\nDry run — re-run with --apply to rewrite.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
