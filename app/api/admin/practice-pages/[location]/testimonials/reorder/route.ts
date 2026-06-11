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
} from "@/lib/practice-pages-shared";

export const runtime = "nodejs";

const bodySchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1).max(200),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ location: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { location } = await ctx.params;
  if (!isPracticeLocationId(location)) {
    return NextResponse.json({ error: "Unknown location" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getFirestore();
  const col = db
    .collection(PRACTICE_PAGES_COLLECTION)
    .doc(location)
    .collection(PRACTICE_TESTIMONIALS_SUBCOLLECTION);

  const batch = db.batch();
  parsed.data.orderedIds.forEach((id, idx) => {
    batch.set(
      col.doc(id),
      {
        order: idx,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: staff.email ?? staff.uid,
      },
      { merge: true },
    );
  });
  await batch.commit();

  revalidatePath(PRACTICE_PAGE_PATHS[location]);
  return NextResponse.json({ ok: true });
}
