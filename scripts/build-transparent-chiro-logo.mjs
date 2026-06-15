/**
 * Removes the white mat behind the circular Paris mark via edge-connected flood
 * fill (so interior whites like the handprint heart stay opaque).
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public/logos/chiropractic-associates.png");
const out = path.join(root, "public/logos/chiropractic-associates-transparent.png");

/** Pixels at/above this min channel are treated as removable white background. */
const BG_MIN_CHANNEL = 232;

function isBackground(r, g, b) {
  return Math.min(r, g, b) >= BG_MIN_CHANNEL;
}

const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const pixelCount = width * height;
const remove = new Uint8Array(pixelCount);
const queue = new Int32Array(pixelCount);
let head = 0;
let tail = 0;

function tryEnqueue(x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const idx = y * width + x;
  if (remove[idx]) return;
  const i = idx * channels;
  if (!isBackground(data[i], data[i + 1], data[i + 2])) return;
  remove[idx] = 1;
  queue[tail++] = idx;
}

for (let x = 0; x < width; x++) {
  tryEnqueue(x, 0);
  tryEnqueue(x, height - 1);
}
for (let y = 0; y < height; y++) {
  tryEnqueue(0, y);
  tryEnqueue(width - 1, y);
}

while (head < tail) {
  const idx = queue[head++];
  const x = idx % width;
  const y = (idx / width) | 0;
  tryEnqueue(x - 1, y);
  tryEnqueue(x + 1, y);
  tryEnqueue(x, y - 1);
  tryEnqueue(x, y + 1);
}

for (let idx = 0; idx < pixelCount; idx++) {
  if (!remove[idx]) continue;
  data[idx * channels + channels - 1] = 0;
}

// Feather anti-aliased edges where art meets the removed background.
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = y * width + x;
    if (remove[idx]) continue;
    const i = idx * channels;
    const minChannel = Math.min(data[i], data[i + 1], data[i + 2]);
    if (minChannel >= BG_MIN_CHANNEL) continue;

    let touchesBg = false;
    for (let dy = -1; dy <= 1 && !touchesBg; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (remove[ny * width + nx]) {
          touchesBg = true;
          break;
        }
      }
    }
    if (!touchesBg) continue;

    const feather = (BG_MIN_CHANNEL - minChannel) / 48;
    const alphaIndex = i + channels - 1;
    data[alphaIndex] = Math.round(data[alphaIndex] * Math.min(1, Math.max(0.35, feather)));
  }
}

await sharp(data, { raw: { width, height, channels } })
  .png()
  .toFile(out);

const meta = await sharp(out).metadata();
console.log(`Wrote ${out} (${meta.width}x${meta.height}, alpha: ${meta.hasAlpha})`);
