/**
 * Offline checks: Firestore massage team rows, public HTTPS portrait URLs, and optional Storage paths.
 *
 * Usage (from repo root, same env as Next — e.g. `.env.local`):
 *   npm run verify:massage-team
 *
 * Requires Firebase Admin credentials (FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS).
 */

import { loadEnvConfig } from "@next/env";
import { getFirestore, getStorageBucket } from "@/lib/firebase-admin";
import {
  listMassageTeamMembers,
  MASSAGE_TEAM_COLLECTION,
  parseMassageTeamDoc,
} from "@/lib/massage-team-data";
import { isMassageTeamManagedStoragePath } from "@/lib/massage-team-upload";

const IMAGE_CT = /^image\/(jpeg|png|webp)$/i;

async function headPortrait(url: string): Promise<{ ok: boolean; status: number; ct: string; detail: string }> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    const ct = res.headers.get("content-type") ?? "";
    const ok = res.ok && IMAGE_CT.test(ct.split(";")[0]?.trim() ?? "");
    return {
      ok,
      status: res.status,
      ct,
      detail: ok ? "ok" : `HTTP ${res.status}, content-type: ${ct || "(none)"}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, ct: "", detail: msg };
  }
}

async function main(): Promise<void> {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);

  const db = getFirestore();
  const snap = await db.collection(MASSAGE_TEAM_COLLECTION).get();

  let invalidDocs = 0;
  for (const doc of snap.docs) {
    const row = parseMassageTeamDoc(doc.id, doc.data());
    if (!row) {
      invalidDocs += 1;
      console.warn(
        `[warn] Document "${doc.id}" does not parse for public marketing (need name, bio, photoUrl). Public pages will skip it.`,
      );
    }
  }

  const members = await listMassageTeamMembers(db);

  if (members.length === 0) {
    console.log(
      `[ok] No usable Firestore rows in "${MASSAGE_TEAM_COLLECTION}". The live site will use the built-in team from code until you add members.`,
    );
    if (invalidDocs > 0) {
      console.log(`      (${invalidDocs} document(s) in the collection failed validation.)`);
    }
    process.exit(0);
  }

  console.log(`[info] ${members.length} marketing-ready member(s). Checking portrait URLs (anonymous HEAD)…`);

  const bucket = getStorageBucket();
  let failures = 0;

  for (const m of members) {
    const head = await headPortrait(m.photoUrl);
    if (!head.ok) {
      failures += 1;
      console.error(`[fail] ${m.name} (${m.id}): ${head.detail}`);
      if (head.status === 403 || head.status === 401) {
        console.error(
          `       Deploy Storage rules allowing public read on public_site/** (see storage.rules), then: firebase deploy --only storage`,
        );
      }
      continue;
    }
    console.log(`[ok]   ${m.name}: ${m.photoUrl.slice(0, 72)}${m.photoUrl.length > 72 ? "…" : ""}`);

    if (m.photoStoragePath && isMassageTeamManagedStoragePath(m.photoStoragePath)) {
      const [exists] = await bucket.file(m.photoStoragePath).exists();
      if (!exists) {
        failures += 1;
        console.error(`[fail] ${m.name}: Firestore photoStoragePath missing in bucket: ${m.photoStoragePath}`);
      }
    }
  }

  if (failures > 0) {
    console.error(`\n[fail] ${failures} issue(s). Fix Storage rules, URLs, or orphaned Firestore fields.`);
    process.exit(1);
  }

  console.log(`\n[ok] All portrait URLs reachable; Storage paths checked where present.`);
  if (invalidDocs > 0) {
    console.log(`[note] ${invalidDocs} other document(s) in the collection are not shown on the public site.`);
  }
}

void main().catch((e) => {
  console.error(e instanceof Error ? e.stack ?? e.message : e);
  process.exit(1);
});
