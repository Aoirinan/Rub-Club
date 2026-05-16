import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import { SITE_FAQS_COLLECTION } from "@/lib/site-faqs";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const patchSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).max(8000).optional(),
  category: z.string().max(80).optional(),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

function bumpFaqCache(): void {
  revalidatePath("/faq");
  revalidatePath("/");
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
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
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const ref = getFirestore().collection(SITE_FAQS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await ref.update({
    ...parsed.data,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: staff.email ?? staff.uid,
  });

  bumpFaqCache();
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await getFirestore().collection(SITE_FAQS_COLLECTION).doc(id).delete();
  bumpFaqCache();
  return NextResponse.json({ ok: true });
}
