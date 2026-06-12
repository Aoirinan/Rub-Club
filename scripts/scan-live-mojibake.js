/** Scan live pages for double-encoded UTF-8, decoding bytes properly. */
const BASE = "https://rub-club.vercel.app";

async function main() {
  const sm = await (await fetch(BASE + "/sitemap.xml")).text();
  const urls = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  let dirty = 0;
  for (const u of urls) {
    const html = await (await fetch(u, { cache: "no-store" })).text();
    const found = [...new Set((html.match(/[\u00c2\u00c3\u00e2][^\x00-\x7f]{0,2}/g) || []))];
    if (found.length) {
      dirty++;
      console.log(u, "->", JSON.stringify(found.join(" | ")));
    }
  }
  console.log(dirty ? `${dirty}/${urls.length} pages dirty` : `all ${urls.length} pages clean`);
}

main();
