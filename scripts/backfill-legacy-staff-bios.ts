/**
 * backfill-legacy-staff-bios.ts  (CURSOR_PROMPT §9)
 *
 * Renders staff bios VERBATIM from legacy_import by matching captured bio
 * paragraphs (and photos) to existing staff records by name, then overwriting
 * the stored bio/photo for confident matches.
 *
 * SAFE: only overwrites when a legacy paragraph clearly belongs to a member
 * ("My name is <First>" or the paragraph starts with the member's name). Where
 * no verbatim source was captured (the legacy Baystone staff pages used
 * carousels the scraper could not fully read), the existing bio is LEFT ALONE
 * and the member is listed for manual entry — per the "do not invent" rule.
 *
 *   npx tsx scripts/backfill-legacy-staff-bios.ts            # dry run + report
 *   npx tsx scripts/backfill-legacy-staff-bios.ts --commit   # write matches
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getFirestore } from "../lib/firebase-admin";

const COMMIT = process.argv.includes("--commit");

const MASSAGE_TEAM = "massage_team_members";
const SITE_STAFF = "site_staff_members";
const LEGACY = "legacy_import";

const STAFF_LEGACY_DOCS = [
  "massage-paris__staff",
  "chiro-paris__meet-the-doctor",
  "chiro-paris__staff",
  "chiro-sulphur__meet-the-staff",
];

type Block = { tag: string; text: string };
type Asset = { url: string; originalUrl?: string; alt?: string; title?: string };

const LOGO_RE = /logo|favicon|sprite|icon/i;
const IMAGE_RE = /\.(webp|jpe?g|png|gif|avif)$/i;

function firstName(name: string): string {
  // Drop honorifics so "Dr. Conner Collins" -> "conner" (not "dr.").
  const parts = name.trim().replace(/^dr\.?\s+/i, "").split(/\s+/);
  return parts[0]?.toLowerCase() ?? "";
}

/**
 * A bio paragraph confidently belongs to `name` ONLY when it is a first-person
 * bio opening with "My name is <First>". This avoids mis-assigning third-person
 * or honorific-led paragraphs (e.g. two different "Collins" doctors). Anything
 * less certain is left for manual entry — per the "do not invent" rule.
 */
function bioForName(blocks: Block[], name: string): string | null {
  const fn = firstName(name);
  if (fn.length < 3) return null;
  for (const b of blocks) {
    if (b.tag !== "p") continue;
    const t = b.text.trim();
    if (t.length < 80) continue;
    if (t.toLowerCase().startsWith(`my name is ${fn}`)) return t;
  }
  return null;
}

/** A photo asset whose alt/filename contains the member's first name. */
function photoForName(assets: Asset[], name: string): string | null {
  const fn = firstName(name);
  if (!fn) return null;
  for (const a of assets) {
    if (!a.url || !IMAGE_RE.test(a.url) || LOGO_RE.test(a.url)) continue;
    const hay = `${a.alt ?? ""} ${a.originalUrl ?? ""} ${a.url}`.toLowerCase();
    if (hay.includes(fn)) return a.url;
  }
  return null;
}

async function main() {
  const db = getFirestore();

  // Gather all legacy staff blocks + assets into one pool per site family.
  const legacy: { blocks: Block[]; assets: Asset[] } = { blocks: [], assets: [] };
  for (const id of STAFF_LEGACY_DOCS) {
    const snap = await db.collection(LEGACY).doc(id).get();
    if (!snap.exists) continue;
    const d = snap.data() as { blocks?: Block[]; assets?: Asset[] };
    if (Array.isArray(d.blocks)) legacy.blocks.push(...d.blocks);
    if (Array.isArray(d.assets)) legacy.assets.push(...d.assets);
  }
  console.log(`legacy staff pool: ${legacy.blocks.length} blocks, ${legacy.assets.length} assets\n`);

  const report: string[] = [];
  let bioUpdates = 0;
  let photoUpdates = 0;

  async function process(collection: string) {
    const snap = await db.collection(collection).get();
    for (const doc of snap.docs) {
      const name = String(doc.get("name") ?? "").trim();
      if (!name) continue;
      const bio = bioForName(legacy.blocks, name);
      // Photo is reported for reference only. We do NOT overwrite existing staff
      // photos: they were already sourced from these legacy assets (via the
      // ibsrv migration) at higher resolution than the tiny scraped thumbnails.
      const photo = photoForName(legacy.assets, name);
      if (photo) photoUpdates++;
      report.push(`${collection}/${name}\t${bio ? "BIO" : "no-bio"}${photo ? " photo-available" : ""}`);
      if (bio && COMMIT) {
        await doc.ref.set({ bio }, { merge: true });
      }
      if (bio) bioUpdates++;
      console.log(`  ${collection}/${name}: ${bio ? "verbatim bio (overwrite)" : "NO verbatim bio"}${photo ? " · legacy photo available" : ""}`);
    }
  }

  await process(MASSAGE_TEAM);
  await process(SITE_STAFF);

  console.log(`\n${COMMIT ? "committed" : "dry run"} — verbatim bios written: ${bioUpdates}, legacy photos available (not overwritten): ${photoUpdates}`);
  console.log("\nMembers with NO verbatim legacy bio need manual entry (Sean):");
  report.filter((r) => r.includes("no-bio")).forEach((r) => console.log("  " + r.split("\t")[0]));
  if (!COMMIT) console.log("\nRe-run with --commit to write matched bios/photos.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
