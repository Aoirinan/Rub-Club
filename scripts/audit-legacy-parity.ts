/**
 * audit-legacy-parity.ts
 *
 * Full audit of EVERY published legacy page:
 *   1. Word-for-word: legacyPages.blocks must equal legacy_import.blocks (byte
 *      identical, tag + text).
 *   2. Picture-for-picture: compares the images the page carries against the
 *      image assets the scraper captured in legacy_import. Reports:
 *        - content images the scraper saw but the page dropped (logos excluded)
 *        - pages the scraper captured with NO content images at all
 *   3. Scans rendered text + image URLs for any cdcssl.ibsrv.net leakage.
 *
 *   npx tsx scripts/audit-legacy-parity.ts
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getFirestore } from "../lib/firebase-admin";

type Block = { tag: string; text: string };
type Asset = { url: string; originalUrl?: string; alt?: string; title?: string };

const IMAGE_RE = /\.(webp|jpe?g|png|gif|avif)$/i;
const LOGO_RE = /logo|favicon|sprite|icon/i;

function imageAssets(assets: Asset[], { excludeLogos }: { excludeLogos: boolean }): string[] {
  const out = new Set<string>();
  for (const a of assets ?? []) {
    const u = a?.url ?? "";
    if (!u || !IMAGE_RE.test(u)) continue;
    if (excludeLogos && LOGO_RE.test(u)) continue;
    out.add(u);
  }
  return [...out];
}

function blocksEqual(a: Block[], b: Block[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].tag !== b[i].tag || a[i].text !== b[i].text) return false;
  }
  return true;
}

async function main() {
  const db = getFirestore();
  const pagesSnap = await db.collection("legacyPages").where("published", "==", true).get();

  let total = 0;
  let wordOk = 0;
  const wordFail: string[] = [];
  const droppedImages: string[] = [];
  const noContentImages: string[] = [];
  let ibsrvHits = 0;

  for (const d of pagesSnap.docs) {
    total++;
    const id = d.id;
    const pageBlocks = (d.get("blocks") as Block[]) ?? [];
    const pageImages: string[] = ((d.get("images") as { url: string }[]) ?? []).map((i) => i.url);

    const importSnap = await db.collection("legacy_import").doc(id).get();
    const importBlocks = (importSnap.get("blocks") as Block[]) ?? [];
    const importAssets = (importSnap.get("assets") as Asset[]) ?? [];

    // 1. Words
    if (blocksEqual(pageBlocks, importBlocks)) wordOk++;
    else wordFail.push(`${id} (page=${pageBlocks.length} import=${importBlocks.length})`);

    // 2. Pictures — content images (logos excluded) the scraper saw
    const contentImgs = imageAssets(importAssets, { excludeLogos: true });
    const onPage = new Set(pageImages);
    const dropped = contentImgs.filter((u) => !onPage.has(u));
    if (contentImgs.length === 0) {
      noContentImages.push(id);
    } else if (dropped.length > 0) {
      droppedImages.push(`${id}: ${dropped.length} dropped of ${contentImgs.length}`);
    }

    // 3. ibsrv leakage in rendered surfaces
    const surfaces = [
      pageBlocks.map((b) => b.text).join("\n"),
      String(d.get("body") ?? ""),
      pageImages.join("\n"),
    ].join("\n");
    ibsrvHits += (surfaces.match(/cdcssl\.ibsrv\.net/gi) ?? []).length;
  }

  console.log(`Published legacy pages audited: ${total}\n`);
  console.log(`WORD-FOR-WORD: ${wordOk}/${total} byte-identical to legacy_import`);
  if (wordFail.length) {
    console.log(`  MISMATCHES (${wordFail.length}):`);
    wordFail.forEach((f) => console.log("    " + f));
  }

  console.log(`\nPICTURE-FOR-PICTURE (vs what the scraper captured):`);
  console.log(`  pages with content images fully carried: ${total - droppedImages.length - noContentImages.length}`);
  console.log(`  pages MISSING some captured content images: ${droppedImages.length}`);
  droppedImages.forEach((f) => console.log("    " + f));
  console.log(`  pages the scraper captured with NO content images (logos/banners only): ${noContentImages.length}`);
  noContentImages.forEach((f) => console.log("    " + f));

  console.log(`\ncdcssl.ibsrv.net references in rendered surfaces: ${ibsrvHits}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
