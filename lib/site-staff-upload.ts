import { getStorageBucket } from "@/lib/firebase-admin";
import {
  MASSAGE_TEAM_ALLOWED_MIME,
  MASSAGE_TEAM_PHOTO_MAX_BYTES,
  publicObjectUrl,
  resolveMassageTeamImageContentType,
} from "@/lib/massage-team-upload";

export {
  MASSAGE_TEAM_PHOTO_MAX_BYTES as SITE_STAFF_PHOTO_MAX_BYTES,
  resolveMassageTeamImageContentType as resolveSiteStaffImageContentType,
};

const PREFIX = "public_site/site_staff";

export function isSiteStaffManagedStoragePath(path: string): boolean {
  return path.startsWith(`${PREFIX}/`);
}

export async function uploadSiteStaffPhoto(opts: {
  memberId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ photoUrl: string; photoStoragePath: string }> {
  const ext = MASSAGE_TEAM_ALLOWED_MIME[opts.contentType];
  if (!ext) {
    throw new Error("Unsupported image type. Use JPEG, PNG, or WebP.");
  }
  if (opts.buffer.length > MASSAGE_TEAM_PHOTO_MAX_BYTES) {
    throw new Error("Image is too large (max 5 MB).");
  }
  if (opts.buffer.length === 0) {
    throw new Error("Empty file.");
  }
  const safeId = opts.memberId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "member";
  const storagePath = `${PREFIX}/${safeId}.${ext}`;
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  await file.save(opts.buffer, {
    metadata: {
      contentType: opts.contentType,
      cacheControl: "public, max-age=3600",
    },
    resumable: false,
  });
  await file.makePublic().catch(() => {});
  const photoUrl = publicObjectUrl(bucket.name, storagePath);
  return { photoUrl, photoStoragePath: storagePath };
}

/** Mirrors the CMS video upload limits (site-content uploads). */
export const SITE_STAFF_VIDEO_MAX_BYTES = 80 * 1024 * 1024;

const STAFF_VIDEO_ALLOWED_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export function resolveSiteStaffVideoContentType(mime: string): string | null {
  const normalized = mime.trim().toLowerCase();
  return STAFF_VIDEO_ALLOWED_MIME[normalized] ? normalized : null;
}

export async function uploadSiteStaffVideo(opts: {
  memberId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ videoUrl: string; videoStoragePath: string }> {
  const ext = STAFF_VIDEO_ALLOWED_MIME[opts.contentType];
  if (!ext) {
    throw new Error("Unsupported video type. Use MP4, MOV, or WebM.");
  }
  if (opts.buffer.length > SITE_STAFF_VIDEO_MAX_BYTES) {
    throw new Error("Video is too large (max 80 MB).");
  }
  if (opts.buffer.length === 0) {
    throw new Error("Empty file.");
  }
  const safeId = opts.memberId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "member";
  const storagePath = `${PREFIX}/${safeId}-video.${ext}`;
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  await file.save(opts.buffer, {
    metadata: {
      contentType: opts.contentType,
      cacheControl: "public, max-age=3600",
    },
    resumable: false,
  });
  await file.makePublic().catch(() => {});
  const videoUrl = publicObjectUrl(bucket.name, storagePath);
  return { videoUrl, videoStoragePath: storagePath };
}

export async function deleteSiteStaffStorageObject(path: string): Promise<void> {
  if (!isSiteStaffManagedStoragePath(path)) return;
  const bucket = getStorageBucket();
  await bucket.file(path).delete({ ignoreNotFound: true });
}
