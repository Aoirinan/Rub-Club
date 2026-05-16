import { randomBytes } from "node:crypto";
import { getStorageBucket } from "@/lib/firebase-admin";
import { OWNER_IMAGE_MAX_BYTES, OWNER_VIDEO_MAX_BYTES } from "@/lib/owner-marketing-limits";
import { publicObjectUrl } from "@/lib/massage-team-upload";

const PREFIX_TESTIMONIALS = "public_site/owner_testimonials";
const PREFIX_DOCTOR = "public_site/doctor_media";
const PREFIX_SPECIALS_POPUP = "public_site/specials_popup";

export { OWNER_IMAGE_MAX_BYTES, OWNER_VIDEO_MAX_BYTES } from "@/lib/owner-marketing-limits";

const SIGNED_URL_TTL_MS = 20 * 60 * 1000;

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

export function isOwnerSpecialsPopupImagePath(p: string): boolean {
  return p.startsWith(`${PREFIX_SPECIALS_POPUP}/`);
}

function safeId(): string {
  return randomBytes(12).toString("hex");
}

export function extForOwnerTestimonialVideo(contentType: string): string | null {
  return VIDEO_EXT[contentType] ?? null;
}

/**
 * Issues a v4 signed PUT URL so the browser can upload directly to GCS (bypasses Vercel's 4.5 MB body limit).
 * Caller must send PUT with exactly `requiredHeaders` (notably Content-Type).
 */
export async function issueOwnerTestimonialVideoUploadSignedUrl(opts: {
  contentType: string;
  sizeBytes?: number;
}): Promise<{
  uploadUrl: string;
  storagePath: string;
  requiredHeaders: Record<string, string>;
}> {
  const ct = opts.contentType.trim();
  const ext = extForOwnerTestimonialVideo(ct);
  if (!ext) {
    throw new Error("Unsupported video type. Use MP4, MOV, or WebM.");
  }
  if (typeof opts.sizeBytes === "number" && opts.sizeBytes > OWNER_VIDEO_MAX_BYTES) {
    throw new Error("Video is too large (max 50 MB).");
  }
  if (typeof opts.sizeBytes === "number" && opts.sizeBytes <= 0) {
    throw new Error("Empty file.");
  }
  const storagePath = `${PREFIX_TESTIMONIALS}/${safeId()}.${ext}`;
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  const expires = Date.now() + SIGNED_URL_TTL_MS;
  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires,
    contentType: ct,
  });
  return {
    uploadUrl,
    storagePath,
    requiredHeaders: { "Content-Type": ct },
  };
}

/**
 * After a browser PUT to the signed URL, validates the object and returns its public URL.
 */
export async function finalizeOwnerTestimonialVideoAfterDirectUpload(
  storagePath: string,
): Promise<{ url: string; storagePath: string; contentType: string; size: number }> {
  if (!isOwnerTestimonialPath(storagePath)) {
    throw new Error("Invalid storage path.");
  }
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  let meta: { size?: string | number; contentType?: string };
  try {
    const [m] = await file.getMetadata();
    meta = m;
  } catch {
    throw new Error("Upload not found. Try uploading again.");
  }
  const size = typeof meta.size === "string" ? Number(meta.size) : Number(meta.size ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("Empty or invalid upload.");
  }
  if (size > OWNER_VIDEO_MAX_BYTES) {
    await file.delete({ ignoreNotFound: true }).catch(() => {});
    throw new Error("Video is too large (max 50 MB).");
  }
  const contentType = (meta.contentType ?? "").trim() || "application/octet-stream";
  if (!extForOwnerTestimonialVideo(contentType)) {
    throw new Error("Unsupported video type after upload.");
  }
  const expectedExt = extForOwnerTestimonialVideo(contentType)!;
  if (!storagePath.endsWith(`.${expectedExt}`)) {
    throw new Error("Upload path does not match content type.");
  }
  await file.setMetadata({
    cacheControl: "public, max-age=3600",
    contentType,
  });
  await file.makePublic().catch(() => {});
  return {
    url: publicObjectUrl(bucket.name, storagePath),
    storagePath,
    contentType,
    size,
  };
}

export async function uploadOwnerTestimonialVideo(opts: {
  buffer: Buffer;
  contentType: string;
}): Promise<{ url: string; storagePath: string }> {
  const ext = VIDEO_EXT[opts.contentType];
  if (!ext) throw new Error("Unsupported video type. Use MP4, MOV, or WebM.");
  if (opts.buffer.length > OWNER_VIDEO_MAX_BYTES) throw new Error("Video is too large (max 50 MB).");
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

function extForOwnerDoctorMediaContent(contentType: string, mediaType: "photo" | "video"): string | null {
  const map = mediaType === "video" ? VIDEO_EXT : IMAGE_EXT;
  return map[contentType] ?? null;
}

export async function issueOwnerDoctorMediaUploadSignedUrl(opts: {
  contentType: string;
  mediaType: "photo" | "video";
  sizeBytes?: number;
}): Promise<{
  uploadUrl: string;
  storagePath: string;
  requiredHeaders: Record<string, string>;
}> {
  const ct = opts.contentType.trim();
  const ext = extForOwnerDoctorMediaContent(ct, opts.mediaType);
  if (!ext) {
    throw new Error(
      opts.mediaType === "video"
        ? "Unsupported video type. Use MP4, MOV, or WebM."
        : "Unsupported image type. Use JPEG, PNG, or WebP.",
    );
  }
  const max = opts.mediaType === "video" ? OWNER_VIDEO_MAX_BYTES : OWNER_IMAGE_MAX_BYTES;
  if (typeof opts.sizeBytes === "number" && opts.sizeBytes > max) {
    throw new Error(opts.mediaType === "video" ? "Video is too large (max 50 MB)." : "Image is too large (max 25 MB).");
  }
  if (typeof opts.sizeBytes === "number" && opts.sizeBytes <= 0) {
    throw new Error("Empty file.");
  }
  const storagePath = `${PREFIX_DOCTOR}/${safeId()}.${ext}`;
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  const expires = Date.now() + SIGNED_URL_TTL_MS;
  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires,
    contentType: ct,
  });
  return { uploadUrl, storagePath, requiredHeaders: { "Content-Type": ct } };
}

export async function finalizeOwnerDoctorMediaAfterDirectUpload(
  storagePath: string,
  mediaType: "photo" | "video",
): Promise<{ url: string; storagePath: string; contentType: string; size: number }> {
  if (!isOwnerDoctorMediaPath(storagePath)) {
    throw new Error("Invalid storage path.");
  }
  const max = mediaType === "video" ? OWNER_VIDEO_MAX_BYTES : OWNER_IMAGE_MAX_BYTES;
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  let meta: { size?: string | number; contentType?: string };
  try {
    const [m] = await file.getMetadata();
    meta = m;
  } catch {
    throw new Error("Upload not found. Try uploading again.");
  }
  const size = typeof meta.size === "string" ? Number(meta.size) : Number(meta.size ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("Empty or invalid upload.");
  }
  if (size > max) {
    await file.delete({ ignoreNotFound: true }).catch(() => {});
    throw new Error(mediaType === "video" ? "Video is too large (max 50 MB)." : "Image is too large (max 25 MB).");
  }
  const contentType = (meta.contentType ?? "").trim() || "application/octet-stream";
  if (!extForOwnerDoctorMediaContent(contentType, mediaType)) {
    throw new Error("Unsupported file type after upload.");
  }
  const expectedExt = extForOwnerDoctorMediaContent(contentType, mediaType)!;
  if (!storagePath.endsWith(`.${expectedExt}`)) {
    throw new Error("Upload path does not match content type.");
  }
  await file.setMetadata({
    cacheControl: "public, max-age=3600",
    contentType,
  });
  await file.makePublic().catch(() => {});
  return {
    url: publicObjectUrl(bucket.name, storagePath),
    storagePath,
    contentType,
    size,
  };
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

export async function uploadOwnerSpecialsPopupImage(opts: {
  buffer: Buffer;
  contentType: string;
}): Promise<{ url: string; storagePath: string }> {
  const ext = IMAGE_EXT[opts.contentType];
  if (!ext) throw new Error("Unsupported image type. Use JPEG, PNG, or WebP.");
  if (opts.buffer.length > OWNER_IMAGE_MAX_BYTES) throw new Error("Image is too large (max 25 MB).");
  if (opts.buffer.length === 0) throw new Error("Empty file.");
  const id = safeId();
  const storagePath = `${PREFIX_SPECIALS_POPUP}/${id}.${ext}`;
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
  if (
    !isOwnerTestimonialPath(storagePath) &&
    !isOwnerDoctorMediaPath(storagePath) &&
    !isOwnerSpecialsPopupImagePath(storagePath)
  ) {
    return;
  }
  const bucket = getStorageBucket();
  await bucket.file(storagePath).delete({ ignoreNotFound: true });
}
