import fs from "node:fs";
import path from "node:path";
import { pdf } from "pdf-to-img";

const pdfPath = process.argv[2];
const outDir = process.argv[3] ?? "tmp-pdf-pages";
if (!pdfPath) {
  console.error("Usage: node scripts/extract-pdf-pages.mjs <pdf> [outDir]");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const doc = await pdf(pdfPath, { scale: 2 });
let i = 0;
for await (const page of doc) {
  i += 1;
  const out = path.join(outDir, `page-${String(i).padStart(2, "0")}.png`);
  fs.writeFileSync(out, page);
  console.log(`wrote ${out} (${page.length} bytes)`);
}
console.log(`done: ${i} pages`);
