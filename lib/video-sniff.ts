/**
 * Recognise uploaded videos by their first bytes instead of trusting the
 * browser-reported `File.type` (the image uploads already sniff magic bytes).
 * Pure — no firebase imports — so it is unit tested in lib/video-sniff.test.ts.
 */

export type SniffedVideoType = "video/mp4" | "video/quicktime" | "video/webm";

/** Top-level atoms an older QuickTime file may start with instead of `ftyp`. */
const QUICKTIME_LEADING_ATOMS = new Set(["moov", "mdat", "wide", "free", "skip", "pnot"]);

function ascii(buffer: Uint8Array, start: number, end: number): string {
  return Array.from(buffer.subarray(start, end), (b) => String.fromCharCode(b)).join("");
}

/** Container type from the file's first bytes, or null if it is not MP4/MOV/WebM. */
export function sniffVideoContentType(buffer: Uint8Array): SniffedVideoType | null {
  if (buffer.length < 12) return null;

  // WebM: EBML header (1A 45 DF A3) whose DocType is "webm" (plain Matroska is
  // not accepted — browsers don't reliably play it).
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return ascii(buffer, 4, Math.min(buffer.length, 64)).includes("webm") ? "video/webm" : null;
  }

  // ISO base media (MP4 / MOV): a size field, then the "ftyp" box and brand.
  const boxType = ascii(buffer, 4, 8);
  if (boxType === "ftyp") {
    return ascii(buffer, 8, 12) === "qt  " ? "video/quicktime" : "video/mp4";
  }
  if (QUICKTIME_LEADING_ATOMS.has(boxType)) return "video/quicktime";
  return null;
}

/**
 * Content type to store for an uploaded video, or null when the bytes are not a
 * supported video. MP4 and MOV share one container, so between those two the
 * browser's label is kept when it names one of them.
 */
export function resolveVideoContentType(declaredType: string, buffer: Uint8Array): SniffedVideoType | null {
  const sniffed = sniffVideoContentType(buffer);
  if (!sniffed) return null;
  const declared = declaredType.trim().toLowerCase();
  if (sniffed !== "video/webm" && (declared === "video/mp4" || declared === "video/quicktime")) {
    return declared;
  }
  return sniffed;
}
