import { getStorageBucket } from "@/lib/firebase-admin";

export const INTAKE_ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const INTAKE_MAX_FILE_BYTES = 10 * 1024 * 1024;

export type IntakeFileKind = "insurance" | "insurance_front" | "insurance_back" | "drivers_license";

export type IntakeStoredFileMeta = {
  storagePath: string;
  contentType: string;
  originalFilename: string;
  bytes: number;
};

export function intakeStorageObjectName(kind: IntakeFileKind): string {
  switch (kind) {
    case "insurance":
      return "insurance_card";
    case "insurance_front":
      return "insurance_card_front";
    case "insurance_back":
      return "insurance_card_back";
    default:
      return "drivers_license";
  }
}

export async function uploadIntakeFileBuffer(opts: {
  intakeId: string;
  kind: IntakeFileKind;
  buffer: Buffer;
  contentType: string;
  originalFilename: string;
}): Promise<IntakeStoredFileMeta> {
  const ext = INTAKE_ALLOWED_MIME[opts.contentType];
  if (!ext) {
    throw new Error("Unsupported file type. Use JPG, PNG, WebP, or PDF.");
  }
  if (opts.buffer.length > INTAKE_MAX_FILE_BYTES) {
    throw new Error("File is too large (max 10 MB).");
  }
  if (opts.buffer.length === 0) {
    throw new Error("Empty file.");
  }
  const base = intakeStorageObjectName(opts.kind);
  const storagePath = `intake_documents/${opts.intakeId}/${base}.${ext}`;
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  await file.save(opts.buffer, {
    metadata: {
      contentType: opts.contentType,
      cacheControl: "private, max-age=0",
    },
    resumable: false,
  });
  return {
    storagePath,
    contentType: opts.contentType,
    originalFilename: opts.originalFilename.slice(0, 200),
    bytes: opts.buffer.length,
  };
}

export async function signedIntakeDocumentUrl(opts: {
  storagePath: string;
  originalFilename: string;
  contentType: string;
  mode: "inline" | "download";
  expiresMs: number;
}): Promise<string> {
  const bucket = getStorageBucket();
  const file = bucket.file(opts.storagePath);
  const safeName = opts.originalFilename.replace(/[^\w.\-()+ ]/g, "_").slice(0, 120) || "document";
  const disposition =
    opts.mode === "download"
      ? `attachment; filename="${safeName}"`
      : `inline; filename="${safeName}"`;
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + opts.expiresMs,
    responseType: opts.contentType,
    responseDisposition: disposition,
  });
  return url;
}
