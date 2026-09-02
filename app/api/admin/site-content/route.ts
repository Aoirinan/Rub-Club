import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  CONTENT_REGISTRY,
  DEFAULTS,
  SITE_CONTENT_COLLECTION,
} from "@/lib/cms";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // One collection read instead of two document reads per registry id.
  const db = getFirestore();
  const snap = await db.collection(SITE_CONTENT_COLLECTION).get();
  const docs = new Map(snap.docs.map((d) => [d.id, d.data()] as const));

  const fields = CONTENT_REGISTRY.map((field) => {
    const data = docs.get(field.id);
    const stored = data?.value;
    const value =
      data !== undefined
        ? (typeof stored === "string" ? stored : DEFAULTS[field.id]) || ""
        : DEFAULTS[field.id] ?? "";
    return {
      ...field,
      value,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() ?? null,
      updatedBy: typeof data?.updatedBy === "string" ? data.updatedBy : null,
      hasFirestoreDoc: data !== undefined,
    };
  });

  return NextResponse.json({ fields, defaults: DEFAULTS });
}
