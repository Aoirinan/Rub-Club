import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { STRETCH_FLEX_COLLECTION } from "@/lib/stretch-flex";

export const runtime = "nodejs";

const imageSchema = z.object({
  url: z.string().max(2000),
  alt: z.string().max(300),
  caption: z.string().max(500),
});

const patchSchema = z.object({
  name: z.string().max(200).optional(),
  instructions: z.string().max(20000).optional(),
  order: z.number().int().min(0).max(100000).optional(),
  images: z.array(imageSchema).max(30).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  await getFirestore()
    .collection(STRETCH_FLEX_COLLECTION)
    .doc(id)
    .set(
      { ...parsed.data, updatedAt: FieldValue.serverTimestamp(), updatedBy: staff.email ?? staff.uid },
      { merge: true },
    );

  revalidatePath("/services/chiropractic/stretch-and-flex-rehab");
  return NextResponse.json({ ok: true });
}
