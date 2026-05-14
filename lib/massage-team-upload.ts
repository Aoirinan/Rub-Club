import { getStorageBucket } from "@/lib/firebase-admin";

export const MASSAGE_TEAM_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const MASSAGE_TEAM_ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PREFIX = "public_site/massage_team";

export function isMassageTeamManagedStoragePath(path: string): boolean {
  return path.startsWith(`${PREFIX}/`);
}

export function publicObjectUrl(bucketName: string, objectPath: string): string {
  const encoded = objectPath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `https://storage.googleapis.com/${bucketName}/${encoded}`;
}

export async function uploadMassageTeamPhoto(opts: {
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
  await file.makePublic().catch(() => {
    /* uniform bucket-level access: rely on Storage rules / IAM for public read */
  });
  const photoUrl = publicObjectUrl(bucket.name, storagePath);
  return { photoUrl, photoStoragePath: storagePath };
}

export async function deleteMassageTeamStorageObject(path: string): Promise<void> {
  if (!isMassageTeamManagedStoragePath(path)) return;
  const bucket = getStorageBucket();
  await bucket.file(path).delete({ ignoreNotFound: true });
}
