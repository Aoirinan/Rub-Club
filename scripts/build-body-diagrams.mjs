/**
 * Generates the front/back body-outline assets used by the online forms
 * body-diagram field. Run: node scripts/build-body-diagrams.mjs
 *
 * Writes public/body-diagram-front.png and public/body-diagram-back.png.
 * Schematic, neutral human outlines (front + back) on a transparent background
 * so a drawable canvas can overlay pain marks on top.
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public");

const W = 320;
const H = 640;

function bodySvg(label) {
  // A simple, symmetric humanoid outline built from primitives. Light fill so
  // marker strokes read clearly; muted outline.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <g fill="#f1ece3" stroke="#6f6457" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <!-- head -->
    <ellipse cx="160" cy="62" rx="42" ry="50"/>
    <!-- neck -->
    <rect x="143" y="104" width="34" height="26" rx="10"/>
    <!-- torso -->
    <path d="M110 138
             Q160 122 210 138
             L222 168
             L214 360
             Q160 376 106 360
             L98 168 Z"/>
    <!-- left arm -->
    <path d="M112 150 Q86 158 80 200 L70 330 Q70 350 86 350 Q98 350 98 332 L104 208 Z"/>
    <!-- right arm -->
    <path d="M208 150 Q234 158 240 200 L250 330 Q250 350 234 350 Q222 350 222 332 L216 208 Z"/>
    <!-- left leg -->
    <path d="M112 356 L106 520 L100 600 Q100 616 118 616 Q134 616 134 600 L150 400 Z"/>
    <!-- right leg -->
    <path d="M208 356 L214 520 L220 600 Q220 616 202 616 Q186 616 186 600 L170 400 Z"/>
    <!-- feet -->
    <ellipse cx="116" cy="620" rx="22" ry="12"/>
    <ellipse cx="204" cy="620" rx="22" ry="12"/>
  </g>
  <text x="160" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#6f6457">${label}</text>
</svg>`;
}

async function main() {
  await sharp(Buffer.from(bodySvg("FRONT")))
    .png()
    .toFile(join(outDir, "body-diagram-front.png"));
  console.log("Wrote public/body-diagram-front.png");

  await sharp(Buffer.from(bodySvg("BACK")))
    .png()
    .toFile(join(outDir, "body-diagram-back.png"));
  console.log("Wrote public/body-diagram-back.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
