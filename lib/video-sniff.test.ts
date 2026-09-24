import { describe, expect, it } from "vitest";
import { resolveVideoContentType, sniffVideoContentType } from "./video-sniff";

function bytes(...parts: Array<number[] | string>): Uint8Array {
  const out: number[] = [];
  for (const p of parts) {
    if (typeof p === "string") for (const ch of p) out.push(ch.charCodeAt(0));
    else out.push(...p);
  }
  while (out.length < 32) out.push(0);
  return Uint8Array.from(out);
}

const MP4 = bytes([0, 0, 0, 0x20], "ftypisom", [0, 0, 2, 0], "isomiso2avc1mp41");
const MOV = bytes([0, 0, 0, 0x14], "ftypqt  ", [0, 0, 0, 0], "qt  ");
const OLD_MOV = bytes([0, 0, 0, 0x08], "wide", [0, 0, 0, 0], "mdat");
const WEBM = bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0x82, 0x84], "webm");
const MKV = bytes([0x1a, 0x45, 0xdf, 0xa3, 0xa3, 0x42, 0x82, 0x88], "matroska");
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const TEXT = bytes("<html><body>not a video</body></html>");

describe("sniffVideoContentType", () => {
  it("recognises MP4, MOV and WebM", () => {
    expect(sniffVideoContentType(MP4)).toBe("video/mp4");
    expect(sniffVideoContentType(MOV)).toBe("video/quicktime");
    expect(sniffVideoContentType(OLD_MOV)).toBe("video/quicktime");
    expect(sniffVideoContentType(WEBM)).toBe("video/webm");
  });

  it("rejects other files", () => {
    expect(sniffVideoContentType(MKV)).toBeNull();
    expect(sniffVideoContentType(PNG)).toBeNull();
    expect(sniffVideoContentType(TEXT)).toBeNull();
    expect(sniffVideoContentType(new Uint8Array(4))).toBeNull();
  });
});

describe("resolveVideoContentType", () => {
  it("rejects a non-video even when the browser calls it video/mp4", () => {
    expect(resolveVideoContentType("video/mp4", TEXT)).toBeNull();
  });

  it("uses the sniffed type when the browser label is missing or wrong", () => {
    expect(resolveVideoContentType("", MP4)).toBe("video/mp4");
    expect(resolveVideoContentType("video/webm", MP4)).toBe("video/mp4");
    expect(resolveVideoContentType("video/mp4", WEBM)).toBe("video/webm");
  });

  it("keeps the browser's MP4/MOV label for the shared container", () => {
    expect(resolveVideoContentType("video/quicktime", MP4)).toBe("video/quicktime");
    expect(resolveVideoContentType("Video/MP4", MOV)).toBe("video/mp4");
  });
});
