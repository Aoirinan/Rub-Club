import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidateTag } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import {
  CONTENT_CHANGE_LOG_COLLECTION,
  SITE_CONTENT_COLLECTION,
  SITE_CONTENT_TAG,
  getContentUncached,
  getContentFieldMeta,
  type ContentFieldType,
} from "@/lib/cms";
import { revalidateSiteContentPaths } from "@/lib/cms-revalidate";
import { uploadSiteContentMedia } from "@/lib/cms-upload";
import { resolveMassageTeamImageContentType } from "@/lib/massage-team-upload";
import { resolveVideoContentType } from "@/lib/video-sniff";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 80 * 1024 * 1024;

function allowedType(fieldType: ContentFieldType, contentType: string): boolean {
  if (fieldType === "image") {
    return ["image/jpeg", "image/png", "image/webp"].includes(contentType);
  }
  if (fieldType === "video") {
    return ["video/mp4", "video/quicktime", "video/webm"].includes(contentType);
  }
  return false;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const meta = getContentFieldMeta(id);
  if (!meta || (meta.type !== "image" && meta.type !== "video")) {
    return NextResponse.json({ error: "Field does not accept uploads" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // Some browsers send an empty File.type for valid JPEGs: sniff magic bytes for
  // images. Videos are checked against their first bytes (MP4/MOV/WebM).
  const contentType =
    meta.type === "image"
      ? resolveMassageTeamImageContentType(file.type, buf) ?? file.type ?? ""
      : resolveVideoContentType(file.type, buf) ?? "";
  if (!allowedType(meta.type, contentType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const max = meta.type === "image" ? MAX_IMAGE : MAX_VIDEO;
  if (buf.length > max) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const oldValue = await getContentUncached(id);
  const url = await uploadSiteContentMedia({
    fieldId: id,
    contentType,
    buffer: buf,
    originalFilename: file.name,
  });

  const db = getFirestore();
  await db
    .collection(SITE_CONTENT_COLLECTION)
    .doc(id)
    .set(
      {
        id,
        pageLabel: meta.pageLabel,
        sectionLabel: meta.sectionLabel,
        fieldLabel: meta.fieldLabel,
        type: meta.type,
        value: url,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: staff.email ?? staff.uid,
      },
      { merge: true },
    );

  await db.collection(CONTENT_CHANGE_LOG_COLLECTION).add({
    fieldId: id,
    pageLabel: meta.pageLabel,
    sectionLabel: meta.sectionLabel,
    fieldLabel: meta.fieldLabel,
    oldValue,
    newValue: url,
    changedAt: FieldValue.serverTimestamp(),
    changedBy: staff.email ?? staff.uid,
  });

  revalidateTag(SITE_CONTENT_TAG);
  // Same refresh as a text save: the layout plus every page that reads site
  // content (this used to cover only six pages).
  revalidateSiteContentPaths();

  return NextResponse.json({ ok: true, value: url });
}
