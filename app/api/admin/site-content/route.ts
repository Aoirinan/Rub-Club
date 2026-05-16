import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  CONTENT_REGISTRY,
  DEFAULTS,
  SITE_CONTENT_COLLECTION,
  getContentMany,
} from "@/lib/cms";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ids = CONTENT_REGISTRY.map((f) => f.id);
  const values = await getContentMany(ids);
  const db = getFirestore();
  const metaSnaps = await Promise.all(
    ids.map((id) => db.collection(SITE_CONTENT_COLLECTION).doc(id).get()),
  );

  const fields = CONTENT_REGISTRY.map((field, i) => {
    const snap = metaSnaps[i];
    const data = snap.data();
    return {
      ...field,
      value: values[field.id] ?? "",
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() ?? null,
      updatedBy: typeof data?.updatedBy === "string" ? data.updatedBy : null,
      hasFirestoreDoc: snap.exists,
    };
  });

  return NextResponse.json({ fields, defaults: DEFAULTS });
}
