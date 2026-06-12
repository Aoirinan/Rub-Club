/**
 * One-shot repair of double-encoded UTF-8 (mojibake) in source files:
 * UTF-8 bytes were misread as cp1252 and re-saved as UTF-8. We reverse that
 * by mapping each suspect char back to its cp1252 byte and re-decoding.
 * Pass --list to print unique suspicious sequences instead of fixing.
 */
const fs = require("fs");
const path = require("path");

const ROOTS = ["app", "components", "lib"];
const EXT = new Set([".ts", ".tsx"]);

// cp1252 0x80-0x9F printable mappings (reverse direction: char -> byte)
const CP1252_REV = new Map(
  Object.entries({
    "\u20ac": 0x80, "\u201a": 0x82, "\u0192": 0x83, "\u201e": 0x84,
    "\u2026": 0x85, "\u2020": 0x86, "\u2021": 0x87, "\u02c6": 0x88,
    "\u2030": 0x89, "\u0160": 0x8a, "\u2039": 0x8b, "\u0152": 0x8c,
    "\u017d": 0x8e, "\u2018": 0x91, "\u2019": 0x92, "\u201c": 0x93,
    "\u201d": 0x94, "\u2022": 0x95, "\u2013": 0x96, "\u2014": 0x97,
    "\u02dc": 0x98, "\u2122": 0x99, "\u0161": 0x9a, "\u203a": 0x9b,
    "\u0153": 0x9c, "\u017e": 0x9e, "\u0178": 0x9f,
  })
);

function charToByte(ch) {
  const cp = ch.codePointAt(0);
  if (cp >= 0x80 && cp <= 0xff) return cp; // includes pass-through C1 controls
  return CP1252_REV.get(ch) ?? null;
}

/** Try to decode `len` chars starting at i as one double-encoded UTF-8 char. */
function tryDecode(text, i, len) {
  const bytes = [];
  for (let k = 0; k < len; k++) {
    const b = charToByte(text[i + k]);
    if (b === null) return null;
    bytes.push(b);
  }
  const decoded = Buffer.from(bytes).toString("utf8");
  // Reject if decoding produced replacement chars (invalid byte sequence)
  if (decoded.includes("\ufffd") || [...decoded].length !== 1) return null;
  return decoded;
}

function fixText(text) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const cp = text.codePointAt(i);
    let len = 0;
    if (cp >= 0xe0 && cp <= 0xef) len = 3; // 3-byte UTF-8 lead (â etc.)
    else if (cp >= 0xc2 && cp <= 0xdf) len = 2; // 2-byte lead (Â, Ã)
    if (len && i + len <= text.length) {
      const decoded = tryDecode(text, i, len);
      if (decoded !== null) {
        out += decoded;
        i += len;
        continue;
      }
    }
    out += text[i];
    i++;
  }
  return out;
}

const listMode = process.argv.includes("--list");
const seen = new Map();
let filesChanged = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full);
    } else if (EXT.has(path.extname(entry.name))) {
      processFile(full);
    }
  }
}

function processFile(file) {
  const text = fs.readFileSync(file, "utf8");
  if (listMode) {
    const re = /[\u00c2-\u00ef][^\x00-\x7f]{0,2}/g;
    for (const m of text.match(re) || []) {
      seen.set(m, (seen.get(m) || 0) + 1);
    }
    return;
  }
  const out = fixText(text);
  if (out !== text) {
    fs.writeFileSync(file, out, "utf8");
    filesChanged++;
    console.log("fixed", file);
  }
}

for (const root of ROOTS) walk(root);

if (listMode) {
  for (const [seq, count] of [...seen.entries()].sort((a, b) => b[1] - a[1])) {
    const codes = [...seq]
      .map((c) => "U+" + c.codePointAt(0).toString(16).padStart(4, "0"))
      .join(" ");
    console.log(JSON.stringify(seq), codes, count);
  }
} else {
  console.log("files changed:", filesChanged);
}
