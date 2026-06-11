import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import {
  PRACTICE_PAGES_COLLECTION,
  PRACTICE_PAGE_PATHS,
  PRACTICE_TESTIMONIALS_SUBCOLLECTION,
  isPracticeLocationId,
  type PracticeLocationId,
} from "@/lib/practice-pages-shared";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().max(200).optional(),
  context: z.string().max(200).optional(),
  quote: z.string().min(1).max(4000).optional(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

function testimonialRef(loc: PracticeLocationId, id: string) {
  return getFirestore()
    .collection(PRACTICE_PAGES_COLLECTION)
    .doc(loc)
    .collection(PRACTICE_TESTIMONIALS_SUBCOLLECTION)
    .doc(id);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ location: string; id: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { location, id } = await ctx.params;
  if (!isPracticeLocationId(location)) {
    return NextResponse.json({ error: "Unknown location" }, { status: 404 });
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

  const ref = testimonialRef(location, id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: staff.email ?? staff.uid,
  };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
  if (parsed.data.context !== undefined) updates.context = parsed.data.context.trim();
  if (parsed.data.quote !== undefined) updates.quote = parsed.data.quote.trim();
  if (parsed.data.order !== undefined) updates.order = parsed.data.order;
  if (parsed.data.published !== undefined) updates.published = parsed.data.published;

  await ref.set(updates, { merge: true });

  revalidatePath(PRACTICE_PAGE_PATHS[location]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ location: string; id: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { location, id } = await ctx.params;
  if (!isPracticeLocationId(location)) {
    return NextResponse.json({ error: "Unknown location" }, { status: 404 });
  }

  await testimonialRef(location, id).delete();

  revalidatePath(PRACTICE_PAGE_PATHS[location]);
  return NextResponse.json({ ok: true });
}
