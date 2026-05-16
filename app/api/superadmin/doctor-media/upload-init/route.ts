import { NextResponse } from "next/server";
import { issueOwnerDoctorMediaUploadSignedUrl } from "@/lib/owner-marketing-upload";
import { assertCanAddDoctorVideo } from "@/lib/owner-upload-quota";
import { getSiteOwnerConfig, type DoctorMediaItem } from "@/lib/site-owner-config";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

const DOCTOR_KEYS = new Set(["greg", "sean", "brandy"]);

/** Same bucket CORS as testimonial videos; see `videos/upload-init` route comment. */
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
  const mediaType = String(o.mediaType ?? "").trim();
  const doctorKey = String(o.doctorKey ?? "").trim().toLowerCase();
  if (mediaType !== "photo" && mediaType !== "video") {
    return NextResponse.json({ error: "mediaType must be photo or video" }, { status: 400 });
  }
  if (!DOCTOR_KEYS.has(doctorKey)) {
    return NextResponse.json({ error: "Invalid doctorKey" }, { status: 400 });
  }
  const sizeBytes =
    typeof o.sizeBytes === "number" && Number.isFinite(o.sizeBytes) ? Math.floor(o.sizeBytes) : undefined;
  try {
    if (mediaType === "video") {
      const config = await getSiteOwnerConfig();
      assertCanAddDoctorVideo(config, doctorKey as DoctorMediaItem["doctorKey"]);
    }
    const out = await issueOwnerDoctorMediaUploadSignedUrl({
      contentType,
      mediaType,
      sizeBytes,
    });
    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not start upload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
