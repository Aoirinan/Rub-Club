import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { LEGACY_PAGES_COLLECTION } from "@/lib/legacy-pages";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().max(300).optional(),
  metaTitle: z.string().max(300).optional(),
  metaDescription: z.string().max(1000).optional(),
  heroImage: z.string().max(2000).optional(),
  order: z.number().int().min(0).max(100000).optional(),
  published: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getFirestore();
  const ref = db.collection(LEGACY_PAGES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await ref.set(
    {
      ...parsed.data,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: staff.email ?? staff.uid,
    },
    { merge: true },
  );

  // Revalidate the affected route (old + new, in case published toggled).
  const route = snap.get("route");
  if (typeof route === "string" && route) revalidatePath(route);

  return NextResponse.json({ ok: true });
}
