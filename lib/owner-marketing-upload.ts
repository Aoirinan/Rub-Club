import { randomBytes } from "node:crypto";
import { getStorageBucket } from "@/lib/firebase-admin";
import { publicObjectUrl } from "@/lib/massage-team-upload";

const PREFIX_TESTIMONIALS = "public_site/owner_testimonials";
const PREFIX_DOCTOR = "public_site/doctor_media";

export const OWNER_VIDEO_MAX_BYTES = 200 * 1024 * 1024;
export const OWNER_IMAGE_MAX_BYTES = 25 * 1024 * 1024;

const VIDEO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isOwnerTestimonialPath(p: string): boolean {
  return p.startsWith(`${PREFIX_TESTIMONIALS}/`);
}

export function isOwnerDoctorMediaPath(p: string): boolean {
  return p.startsWith(`${PREFIX_DOCTOR}/`);
}

function safeId(): string {
  return randomBytes(12).toString("hex");
}

export async function uploadOwnerTestimonialVideo(opts: {
  buffer: Buffer;
  contentType: string;
}): Promise<{ url: string; storagePath: string }> {
  const ext = VIDEO_EXT[opts.contentType];
  if (!ext) throw new Error("Unsupported video type. Use MP4, MOV, or WebM.");
  if (opts.buffer.length > OWNER_VIDEO_MAX_BYTES) throw new Error("Video is too large (max 200 MB).");
  if (opts.buffer.length === 0) throw new Error("Empty file.");
  const id = safeId();
  const storagePath = `${PREFIX_TESTIMONIALS}/${id}.${ext}`;
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  await file.save(opts.buffer, {
    metadata: { contentType: opts.contentType, cacheControl: "public, max-age=3600" },
    resumable: false,
  });
  await file.makePublic().catch(() => {});
  return { url: publicObjectUrl(bucket.name, storagePath), storagePath };
}

export async function uploadOwnerDoctorMedia(opts: {
  buffer: Buffer;
  contentType: string;
  mediaType: "photo" | "video";
}): Promise<{ url: string; storagePath: string }> {
  const map = opts.mediaType === "video" ? VIDEO_EXT : IMAGE_EXT;
  const ext = map[opts.contentType];
  if (!ext) throw new Error("Unsupported file type for this media mode.");
  const max = opts.mediaType === "video" ? OWNER_VIDEO_MAX_BYTES : OWNER_IMAGE_MAX_BYTES;
  if (opts.buffer.length > max) throw new Error("File is too large.");
  if (opts.buffer.length === 0) throw new Error("Empty file.");
  const id = safeId();
  const storagePath = `${PREFIX_DOCTOR}/${id}.${ext}`;
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  await file.save(opts.buffer, {
    metadata: { contentType: opts.contentType, cacheControl: "public, max-age=3600" },
    resumable: false,
  });
  await file.makePublic().catch(() => {});
  return { url: publicObjectUrl(bucket.name, storagePath), storagePath };
}

export async function deleteOwnerMarketingObject(storagePath: string): Promise<void> {
  if (!isOwnerTestimonialPath(storagePath) && !isOwnerDoctorMediaPath(storagePath)) return;
  const bucket = getStorageBucket();
  await bucket.file(storagePath).delete({ ignoreNotFound: true });
}
