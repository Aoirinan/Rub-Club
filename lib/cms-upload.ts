import { randomBytes } from "node:crypto";
import { getStorageBucket } from "@/lib/firebase-admin";
import { publicObjectUrl } from "@/lib/massage-team-upload";

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const VIDEO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function uploadSiteContentMedia(opts: {
  fieldId: string;
  contentType: string;
  buffer: Buffer;
  originalFilename: string;
}): Promise<string> {
  const ct = opts.contentType.trim();
  const isImage = ct.startsWith("image/");
  const extMap = isImage ? IMAGE_EXT : VIDEO_EXT;
  const ext = extMap[ct];
  if (!ext) {
    throw new Error(isImage ? "Unsupported image type" : "Unsupported video type");
  }
  const base = safeFilename(opts.originalFilename.replace(/\.[^.]+$/, "")) || "file";
  const path = `site_content/${opts.fieldId}/${base}-${randomBytes(6).toString("hex")}.${ext}`;
  const bucket = getStorageBucket();
  const file = bucket.file(path);
  await file.save(opts.buffer, {
    metadata: { contentType: ct, cacheControl: "public, max-age=31536000" },
  });
  try {
    await file.makePublic();
  } catch {
    /* bucket may use uniform access */
  }
  return publicObjectUrl(bucket.name, path);
}
