import { NextResponse } from "next/server";
import { issueOwnerTestimonialVideoUploadSignedUrl } from "@/lib/owner-marketing-upload";
import { assertCanAddTestimonialVideo } from "@/lib/owner-upload-quota";
import { getSiteOwnerConfig } from "@/lib/site-owner-config";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

/**
 * Browser uploads must PUT the file bytes to the returned `uploadUrl` (Google Cloud Storage),
 * not to Vercel — Vercel functions reject request bodies larger than ~4.5 MB.
 *
 * **Bucket CORS (required once per bucket):** allow your site origins to `PUT` with `Content-Type`
 * to `https://storage.googleapis.com` (see https://cloud.google.com/storage/docs/cross-origin#configuring-cors).
 * Without CORS, the browser PUT will fail after this route succeeds.
 *
 * From the repo root (same `.env.local` as Next): `npm run storage:apply-cors`
 * Optional: `STORAGE_CORS_ORIGINS=https://a.com,https://b.com` (comma-separated; default is `*`).
 */
export async function POST(req: Request) {
  if (!(await isSuperadminRequest(req.headers.get("cookie")))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const contentType = typeof o.contentType === "string" ? o.contentType : "";
  const massageMemberId =
    typeof o.massageMemberId === "string" && o.massageMemberId.trim() ? o.massageMemberId.trim() : undefined;
  const sizeBytes =
    typeof o.sizeBytes === "number" && Number.isFinite(o.sizeBytes) ? Math.floor(o.sizeBytes) : undefined;
  try {
    const config = await getSiteOwnerConfig();
    assertCanAddTestimonialVideo(config, { massageMemberId });
    const out = await issueOwnerTestimonialVideoUploadSignedUrl({ contentType, sizeBytes });
    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not start upload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
