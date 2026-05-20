import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import {
  CMS_REVALIDATE_PATHS,
  CONTENT_CHANGE_LOG_COLLECTION,
  SITE_CONTENT_COLLECTION,
  getContent,
  getContentFieldMeta,
} from "@/lib/cms";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const patchSchema = z.object({
  value: z.string().max(100_000),
});

function revalidatePublicPages(fieldId?: string): void {
  for (const p of CMS_REVALIDATE_PATHS) {
    revalidatePath(p);
  }
  if (fieldId?.startsWith("ss_page_")) {
    const slug = fieldId.replace(/^ss_page_/, "").replace(/_(body|meta)$/, "");
    if (slug) revalidatePath(`/sulphur-springs/${slug}`);
  }
  if (
    fieldId?.startsWith("ss_staff_") ||
    fieldId === "ss_patient_resources_intro"
  ) {
    revalidatePath("/sulphur-springs/staff");
    revalidatePath("/sulphur-springs/patient-resources");
  }
  if (fieldId?.startsWith("paris_staff_")) {
    revalidatePath("/locations/paris/staff");
    revalidatePath("/locations/paris");
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const meta = getContentFieldMeta(id);
  if (!meta) {
    return NextResponse.json({ error: "Unknown field" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const oldValue = await getContent(id);
  const newValue = parsed.data.value;

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
        value: newValue,
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
    newValue,
    changedAt: FieldValue.serverTimestamp(),
    changedBy: staff.email ?? staff.uid,
  });

  revalidatePublicPages(id);

  return NextResponse.json({ ok: true, value: newValue });
}
