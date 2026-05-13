/**
 * Fetches per-vertebra nerve chart assets (built dynamically in custom.js).
 * Run from repo root: node scripts/fetch-spine-vertebra-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";

const BASE =
  "https://www.massageparistexas.com/content/baystonechiro/3d_spine/nerve_chart/";
const OUT = path.join(process.cwd(), "public", "spine-simulator", "nerve_chart");

const IDS = [
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
  "L1",
  "L2",
  "L3",
  "L4",
  "L5",
  "SACR",
];

async function save(rel) {
  const url = new URL(rel, BASE).href;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`MISS ${rel} (${res.status})`);
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = path.join(OUT, rel.split("/").join(path.sep));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return true;
}

async function main() {
  const tasks = [];
  for (const id of IDS) {
    tasks.push(`images/${id}.png`);
    tasks.push(`images/${id}-nerves.gif`);
    tasks.push(`images/${id}-spine.png`);
    for (let i = 1; i <= 6; i++) {
      tasks.push(`images/${id}/${i}.png`);
    }
  }

  let ok = 0;
  for (const rel of tasks) {
    if (await save(rel)) ok++;
  }

  // Remove mistaken crawl folder (wrong case / partial path on Windows).
  const bad = path.join(OUT, "images", "c");
  if (fs.existsSync(bad)) {
    fs.rmSync(bad, { recursive: true, force: true });
    console.log("Removed erroneous images/c/");
  }

  console.log(`Fetched ${ok}/${tasks.length} vertebra assets.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
