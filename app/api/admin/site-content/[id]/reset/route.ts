import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import {
  CONTENT_CHANGE_LOG_COLLECTION,
  DEFAULTS,
  SITE_CONTENT_COLLECTION,
  getContent,
  getContentFieldMeta,
} from "@/lib/cms";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/faq",
  "/contact",
  "/services/chiropractic",
  "/services/massage",
  "/sulphur-springs",
];

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const meta = getContentFieldMeta(id);
  if (!meta) {
    return NextResponse.json({ error: "Unknown field" }, { status: 404 });
  }

  const defaultValue = DEFAULTS[id] ?? "";
  const oldValue = await getContent(id);

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
        value: defaultValue,
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
    newValue: defaultValue,
    changedAt: FieldValue.serverTimestamp(),
    changedBy: staff.email ?? staff.uid,
  });

  for (const p of PUBLIC_PATHS) {
    revalidatePath(p);
  }

  return NextResponse.json({ ok: true, value: defaultValue });
}
