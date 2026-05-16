import { getStorageBucket } from "@/lib/firebase-admin";
import { INTAKE_ALLOWED_MIME, INTAKE_MAX_FILE_BYTES } from "@/lib/intake-documents";

export type InsuranceCardSide = "front" | "back";

export async function uploadPatientInsuranceCard(opts: {
  patientId: string;
  side: InsuranceCardSide;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  const ext = INTAKE_ALLOWED_MIME[opts.contentType];
  if (!ext) {
    throw new Error("Unsupported file type. Use JPG, PNG, or WebP.");
  }
  if (opts.buffer.length > INTAKE_MAX_FILE_BYTES) {
    throw new Error("File is too large (max 10 MB).");
  }
  const objectName = opts.side === "front" ? "insurance_front" : "insurance_back";
  const storagePath = `patients/${opts.patientId}/${objectName}.${ext}`;
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  await file.save(opts.buffer, {
    metadata: { contentType: opts.contentType, cacheControl: "private, max-age=3600" },
    resumable: false,
  });
  await file.makePublic().catch(() => {});
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  return publicUrl;
}
