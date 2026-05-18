import { getStorageBucket } from "@/lib/firebase-admin";
import {
  MASSAGE_TEAM_ALLOWED_MIME,
  MASSAGE_TEAM_PHOTO_MAX_BYTES,
  publicObjectUrl,
  resolveMassageTeamImageContentType,
} from "@/lib/massage-team-upload";

const PREFIX = "public_site/bookable_providers";

export function isProviderManagedStoragePath(path: string): boolean {
  return path.startsWith(`${PREFIX}/`);
}

export async function uploadProviderPhoto(opts: {
  providerId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ photoUrl: string; photoStoragePath: string }> {
  const contentType = resolveMassageTeamImageContentType(opts.contentType, opts.buffer);
  if (!contentType) {
    throw new Error("Unsupported image type. Use JPEG, PNG, or WebP.");
  }
  const ext = MASSAGE_TEAM_ALLOWED_MIME[contentType];
  if (!ext) {
    throw new Error("Unsupported image type. Use JPEG, PNG, or WebP.");
  }
  if (opts.buffer.length > MASSAGE_TEAM_PHOTO_MAX_BYTES) {
    throw new Error("Image is too large (max 5 MB).");
  }
  if (opts.buffer.length === 0) {
    throw new Error("Empty file.");
  }
  const safeId = opts.providerId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "provider";
  const storagePath = `${PREFIX}/${safeId}.${ext}`;
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  await file.save(opts.buffer, {
    metadata: {
      contentType,
      cacheControl: "public, max-age=3600",
    },
    resumable: false,
  });
  await file.makePublic().catch(() => {
    /* uniform bucket-level access */
  });
  const photoUrl = publicObjectUrl(bucket.name, storagePath);
  return { photoUrl, photoStoragePath: storagePath };
}

export async function deleteProviderStorageObject(path: string): Promise<void> {
  if (!isProviderManagedStoragePath(path)) return;
  const bucket = getStorageBucket();
  await bucket.file(path).delete({ ignoreNotFound: true });
}
