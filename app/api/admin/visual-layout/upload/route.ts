import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { uploadSiteContentMedia } from "@/lib/cms-upload";
import { SITE_CONTENT_COLLECTION } from "@/lib/cms";
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
  const contentType = file.type || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Images only" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const url = await uploadSiteContentMedia({
    fieldId,
    contentType,
    buffer: buf,
    originalFilename: file.name,
  });

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

  return NextResponse.json({ url, fieldId });
}
