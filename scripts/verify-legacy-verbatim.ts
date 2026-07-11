/**
 * verify-legacy-verbatim.ts  (CURSOR_PROMPT §0 sanity check)
 *
 * Picks 3 random published legacy pages and diffs the promoted `legacyPages`
 * blocks (what the page renders, verbatim) against the original `legacy_import`
 * blocks. The diff must be empty. Also scans rendered text for any surviving
 * cdcssl.ibsrv.net references (must be zero).
 *
 *   npx tsx scripts/verify-legacy-verbatim.ts
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getFirestore } from "../lib/firebase-admin";

type Block = { tag: string; text: string };

function blocksEqual(a: Block[], b: Block[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].tag !== b[i].tag || a[i].text !== b[i].text) return false;
  }
  return true;
}

async function main() {
  const db = getFirestore();
  const snap = await db.collection("legacyPages").where("published", "==", true).get();
  const docs = snap.docs;
  if (!docs.length) {
    console.error("No published legacyPages found.");
    process.exit(1);
  }

  // Deterministic-ish random sample of 3.
  const picks = [...docs].sort(() => Math.random() - 0.5).slice(0, 3);

  let allEqual = true;
  let ibsrvHits = 0;

  for (const d of picks) {
    const pageBlocks = (d.get("blocks") as Block[]) ?? [];
    const importSnap = await db.collection("legacy_import").doc(d.id).get();
    const importBlocks = (importSnap.get("blocks") as Block[]) ?? [];
    const equal = blocksEqual(pageBlocks, importBlocks);
    if (!equal) allEqual = false;

    const joined = pageBlocks.map((b) => b.text).join("\n");
    const ibsrv = (joined.match(/cdcssl\.ibsrv\.net/gi) ?? []).length;
    ibsrvHits += ibsrv;

    console.log(
      `${d.id}\n  blocks: page=${pageBlocks.length} import=${importBlocks.length} | verbatim diff empty: ${equal ? "YES" : "NO"} | ibsrv refs: ${ibsrv}`,
    );
  }

  console.log(`\nverbatim diff empty on all sampled pages: ${allEqual ? "YES" : "NO"}`);
  console.log(`cdcssl.ibsrv.net references in rendered text: ${ibsrvHits}`);
  if (!allEqual || ibsrvHits > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
