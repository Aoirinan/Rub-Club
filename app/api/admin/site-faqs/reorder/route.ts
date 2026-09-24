import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import { SITE_FAQS_COLLECTION } from "@/lib/site-faqs";
import { reorderedFaqSlots } from "@/lib/site-faqs-reorder";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const schema = z.object({
  /** Every FAQ the editor panel lists, in the new order. */
  orderedIds: z.array(z.string().min(1)).min(1).max(500),
  /**
   * Sent by older editor tabs. Ignored: the listed ids alone decide which FAQs
   * move, and no FAQ's category is changed by reordering.
   */
  category: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const orderedIds = parsed.data.orderedIds;
  if (new Set(orderedIds).size !== orderedIds.length) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getFirestore();
  const snap = await db.collection(SITE_FAQS_COLLECTION).get();
  const currentOrder = new Map(
    snap.docs.map((d) => {
      const order = d.get("order");
      return [d.id, typeof order === "number" ? order : 0] as const;
    }),
  );
  if (orderedIds.some((id) => !currentOrder.has(id))) {
    return NextResponse.json(
      { error: "The FAQ list changed since you opened it. It has been reloaded — try again." },
      { status: 409 },
    );
  }

  // The listed FAQs swap among the slots they already hold; every other FAQ
  // (e.g. the other office's) keeps its order value and position.
  const changes = reorderedFaqSlots(orderedIds, currentOrder);
  if (changes.length > 0) {
    const batch = db.batch();
    for (const { id, order } of changes) {
      batch.update(db.collection(SITE_FAQS_COLLECTION).doc(id), { order });
    }
    await batch.commit();
  }

  revalidatePath("/faq");
  revalidatePath("/sulphur-springs/q-and-a");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
