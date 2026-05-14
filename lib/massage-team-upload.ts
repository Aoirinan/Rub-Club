import { getStorageBucket } from "@/lib/firebase-admin";

export const MASSAGE_TEAM_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const MASSAGE_TEAM_ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Some browsers report an empty `File.type` for valid images (often JPEG on Windows).
 * Accept declared type when known; otherwise sniff magic bytes.
 */
export function resolveMassageTeamImageContentType(declaredType: string, buffer: Buffer): string | null {
  if (MASSAGE_TEAM_ALLOWED_MIME[declaredType]) return declaredType;
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null;
}

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
