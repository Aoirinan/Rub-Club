import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import { uploadSiteContentMedia } from "@/lib/cms-upload";
import { resolveMassageTeamImageContentType } from "@/lib/massage-team-upload";
import { SITE_CONTENT_COLLECTION, SITE_CONTENT_TAG } from "@/lib/cms";
import { isVisualScopeId } from "@/lib/visual-page-layout";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const scope = String(form.get("scope") ?? "");
  const layerId = String(form.get("layerId") ?? "");
  const file = form.get("file");

  if (!isVisualScopeId(scope) || !layerId || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing scope, layerId, or file" }, { status: 400 });
  }

  const fieldId = `visual_${scope}_${layerId}`.replace(/[^a-zA-Z0-9_]/g, "_");
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }
  // Some browsers send an empty File.type for valid JPEGs: sniff magic bytes.
  const contentType = resolveMassageTeamImageContentType(file.type, buf);
  if (!contentType) {
    return NextResponse.json(
      { error: "Unsupported image type. Use JPEG, PNG, or WebP." },
      { status: 400 },
    );
  }

  let url: string;
  try {
    url = await uploadSiteContentMedia({
      fieldId,
      contentType,
      buffer: buf,
      originalFilename: file.name,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }

  const db = getFirestore();
  await db.collection(SITE_CONTENT_COLLECTION).doc(fieldId).set(
    {
      id: fieldId,
      pageLabel: "Visual editor",
      sectionLabel: scope,
      fieldLabel: `Image ${layerId}`,
      type: "image",
      value: url,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: staff.email ?? staff.uid,
    },
    { merge: true },
  );

  revalidateTag(SITE_CONTENT_TAG);

  return NextResponse.json({ url, fieldId });
}
