/**
 * Builds a wider Paris chiro lockup PNG from the clinic-approved circular asset.
 * Horizontally scales the artwork (~28%) onto a wide white canvas for header use.
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public/logos/chiropractic-associates.png");
const out = path.join(root, "public/logos/chiropractic-associates-wide.png");

const TARGET_W = 1100;
const TARGET_H = 380;
/** Horizontal stretch after fitting to header height — keeps artwork recognizable. */
const SCALE_X = 1.32;

const meta = await sharp(source).metadata();
const srcW = meta.width ?? 851;
const srcH = meta.height ?? 618;

const fitH = TARGET_H - 24;
const fitW = Math.round((srcW / srcH) * fitH);
const scaledW = Math.round(fitW * SCALE_X);

const scaled = await sharp(source)
  .resize(fitW, fitH, { fit: "inside" })
  .resize(scaledW, fitH, { fit: "fill" })
  .png()
  .toBuffer();

const left = Math.max(0, Math.round((TARGET_W - scaledW) / 2));
const top = Math.max(0, Math.round((TARGET_H - fitH) / 2));

await sharp({
  create: {
    width: TARGET_W,
    height: TARGET_H,
    channels: 3,
    background: { r: 255, g: 255, b: 255 },
  },
})
  .composite([{ input: scaled, left, top }])
  .png()
  .toFile(out);

const info = await sharp(out).metadata();
console.log(`Wrote ${out} (${info.width}x${info.height})`);
