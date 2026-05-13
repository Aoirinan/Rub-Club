/**
 * One-off crawler: copies Baystone nerve_chart static files into public/spine-simulator/nerve_chart/
 * so the app can self-host the simulator. Run: node scripts/mirror-baystone-spine.mjs
 *
 * Afterward run: node scripts/fetch-spine-vertebra-assets.mjs
 * (custom.js loads images/C1/1.png etc., which href-regex crawling does not discover.)
 */
import fs from "node:fs";
import path from "node:path";

const BASE = "https://www.massageparistexas.com/content/baystonechiro/3d_spine/nerve_chart/";
const OUT_ROOT = path.join(process.cwd(), "public", "spine-simulator", "nerve_chart");
const MARKER = "/content/baystonechiro/3d_spine/nerve_chart/";

const fetched = new Set();
const queue = ["nerve.html", "postures.html", "subluxation-degeneration.html"];

function relFromAbs(absUrl) {
  let u;
  try {
    u = new URL(absUrl);
  } catch {
    return null;
  }
  if (u.origin !== "https://www.massageparistexas.com") return null;
  const i = u.pathname.indexOf(MARKER);
  if (i === -1) return null;
  return u.pathname.slice(i + MARKER.length).replace(/^\//, "") || "";
}

function extractRefs(htmlOrCss, fromUrl, isCss) {
  const refs = new Set();
  const text = htmlOrCss;
  if (!isCss) {
    const re = /(?:src|href)=["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(text))) {
      const raw = m[1].trim();
      if (
        raw.startsWith("#") ||
        raw.startsWith("mailto:") ||
        raw.startsWith("javascript:") ||
        raw.startsWith("//")
      ) {
        continue;
      }
      try {
        const abs = new URL(raw, fromUrl).href;
        const r = relFromAbs(abs);
        if (r) refs.add(r);
      } catch {
        /* ignore */
      }
    }
  }
  const urlRe = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
  let m2;
  while ((m2 = urlRe.exec(text))) {
    const raw = m2[1].trim();
    if (raw.startsWith("data:")) continue;
    try {
      const abs = new URL(raw, fromUrl).href;
      const r = relFromAbs(abs);
      if (r) refs.add(r);
    } catch {
      /* ignore */
    }
  }
  return refs;
}

async function download(rel) {
  const url = new URL(rel, BASE).href;
  if (fetched.has(url)) return;
  fetched.add(url);

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`SKIP ${rel} -> ${res.status}`);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = path.join(OUT_ROOT, rel.split("/").join(path.sep));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const isHtml = ct.includes("html") || rel.endsWith(".html");
  const isCss = ct.includes("css") || rel.endsWith(".css");
  const isJs = ct.includes("javascript") || rel.endsWith(".js");

  if (isHtml || isCss || isJs) {
    const text = buf.toString("utf8");
    for (const r of extractRefs(text, url, isCss)) {
      if (!fetched.has(new URL(r, BASE).href)) queue.push(r);
    }
  }
}

async function main() {
  fs.rmSync(OUT_ROOT, { recursive: true, force: true });
  fs.mkdirSync(OUT_ROOT, { recursive: true });

  while (queue.length) {
    const rel = queue.shift();
    const abs = new URL(rel, BASE).href;
    if (fetched.has(abs)) continue;
    await download(rel);
  }

  console.log(`Done. Files saved under ${OUT_ROOT} (${fetched.size} URLs fetched).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
