/**
 * Applies CORS on the Firebase/GCS bucket so browsers can PUT testimonial videos
 * directly to storage.googleapis.com (signed URL flow).
 *
 * From repo root (loads `.env.local` like Next):
 *   npm run storage:apply-cors
 *
 * Requires the same credentials as the app: FIREBASE_SERVICE_ACCOUNT_KEY or
 * GOOGLE_APPLICATION_CREDENTIALS, and optional FIREBASE_STORAGE_BUCKET.
 *
 * This replaces the bucket's entire CORS list. Default rule uses origin "*"
 * (no cookies on the GCS request; the signed URL is the gate). To restrict origins,
 * set STORAGE_CORS_ORIGINS to a comma-separated list (overrides "*").
 */

import { loadEnvConfig } from "@next/env";
import { getStorageBucket } from "@/lib/firebase-admin";

type GcsCorsRule = {
  maxAgeSeconds?: number;
  method?: string[];
  origin?: string[];
  responseHeader?: string[];
};

function parseOrigins(): string[] {
  const raw = process.env.STORAGE_CORS_ORIGINS?.trim();
  if (!raw) return ["*"];
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : ["*"];
}

async function main(): Promise<void> {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);

  const origins = parseOrigins();
  const cors: GcsCorsRule[] = [
    {
      maxAgeSeconds: 3600,
      method: ["GET", "HEAD", "PUT", "OPTIONS"],
      origin: origins,
      responseHeader: [
        "Content-Type",
        "Content-Length",
        "Content-Range",
        "x-goog-generation",
        "x-goog-metageneration",
        "x-goog-hash",
        "x-goog-stored-content-encoding",
        "x-goog-storage-class",
      ],
    },
  ];

  const bucket = getStorageBucket();
  await bucket.setCorsConfiguration(cors);
  console.log(`CORS updated for bucket: ${bucket.name}`);
  console.log(`Origins: ${origins.join(", ")}`);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
