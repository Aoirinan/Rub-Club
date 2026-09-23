import { describe, expect, it } from "vitest";
import {
  ADMIN_UPLOAD_LIMIT_BYTES,
  ADMIN_UPLOAD_MAYBE_TOO_LARGE,
  adminUploadTooLargeMessage,
  readAdminUploadJson,
} from "./admin-upload-limit";

function fileOfSize(bytes: number, name = "photo.jpg"): File {
  return new File([new Uint8Array(bytes)], name, { type: "image/jpeg" });
}

describe("adminUploadTooLargeMessage", () => {
  it("allows files at the limit", () => {
    expect(adminUploadTooLargeMessage(fileOfSize(ADMIN_UPLOAD_LIMIT_BYTES))).toBeNull();
  });

  it("names the size and the limit for an oversized file", () => {
    expect(adminUploadTooLargeMessage(fileOfSize(6_200_000))).toBe(
      "This file is 6.2 MB; the upload limit is 4.5 MB — please use a smaller file.",
    );
  });

  it("never reports an over-limit file as 4.5 MB", () => {
    expect(adminUploadTooLargeMessage(fileOfSize(ADMIN_UPLOAD_LIMIT_BYTES + 1))).toContain(
      "is 4.6 MB",
    );
  });

  it("adds up files sent in the same request and ignores empty slots", () => {
    const msg = adminUploadTooLargeMessage([fileOfSize(3_000_000), null, fileOfSize(2_000_000)]);
    expect(msg).toBe(
      "These files are 5.0 MB; the upload limit is 4.5 MB — please use a smaller file.",
    );
    expect(adminUploadTooLargeMessage([fileOfSize(1_000), undefined])).toBeNull();
  });
});

describe("readAdminUploadJson", () => {
  it("returns the JSON body", async () => {
    const res = new Response(JSON.stringify({ url: "https://x/y.jpg" }), { status: 200 });
    await expect(readAdminUploadJson<{ url?: string }>(res)).resolves.toEqual({
      url: "https://x/y.jpg",
    });
  });

  it("keeps the route's own error", async () => {
    const res = new Response(JSON.stringify({ error: "Unsupported file type" }), { status: 400 });
    await expect(readAdminUploadJson(res)).resolves.toEqual({ error: "Unsupported file type" });
  });

  it("turns a non-JSON rejection into a size hint", async () => {
    const res = new Response("Request Entity Too Large", { status: 413 });
    await expect(readAdminUploadJson(res)).resolves.toEqual({
      error: ADMIN_UPLOAD_MAYBE_TOO_LARGE,
    });
  });
});
