import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { finalizeOwnerTestimonialVideoAfterDirectUpload } from "@/lib/owner-marketing-upload";
import { MASSAGE_TEAM_COLLECTION } from "@/lib/massage-team-data";
import { assertCanAddTestimonialVideo } from "@/lib/owner-upload-quota";
import { getFirestore } from "@/lib/firebase-admin";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch, type TestimonialVideoItem } from "@/lib/site-owner-config";
import { authorizeOwnerMarketing, unauthorizedOwnerMarketing } from "@/lib/owner-marketing-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const marketingAuth = await authorizeOwnerMarketing(req);
  if (!marketingAuth.ok) return unauthorizedOwnerMarketing();
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
  const storagePath = typeof o.storagePath === "string" ? o.storagePath.trim() : "";
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const label = typeof o.label === "string" ? o.label.trim() : "";
  const massageMemberId =
    typeof o.massageMemberId === "string" && o.massageMemberId.trim() ? o.massageMemberId.trim() : undefined;
  if (!storagePath) {
    return NextResponse.json({ error: "storagePath is required" }, { status: 400 });
  }

  const cur = await getSiteOwnerConfig();
  if (cur.testimonialVideos.some((v) => v.storagePath === storagePath)) {
    return NextResponse.json({ error: "This video is already registered." }, { status: 400 });
  }

  if (massageMemberId) {
    const memberSnap = await getFirestore().collection(MASSAGE_TEAM_COLLECTION).doc(massageMemberId).get();
    if (!memberSnap.exists) {
      return NextResponse.json({ error: "Unknown massage therapist." }, { status: 400 });
    }
  }

  try {
    assertCanAddTestimonialVideo(cur, { massageMemberId });
    const { url } = await finalizeOwnerTestimonialVideoAfterDirectUpload(storagePath);
    const id = randomUUID();
    const item: TestimonialVideoItem = {
      id,
      title,
      label,
      ...(massageMemberId ? { massageMemberId } : {}),
      url,
      storagePath,
      createdAt: new Date().toISOString(),
    };
    const nextVideos = [...cur.testimonialVideos, item];
    await setSiteOwnerConfigPatch({ testimonialVideos: nextVideos });
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
