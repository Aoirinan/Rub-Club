import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import { SITE_FAQS_COLLECTION } from "@/lib/site-faqs";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const schema = z.object({
  orderedIds: z.array(z.string().min(1)),
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

  const db = getFirestore();
  const orderedIds = parsed.data.orderedIds;
  const category = parsed.data.category?.trim();

  const batch = db.batch();
  if (!category) {
    orderedIds.forEach((id, index) => {
      batch.update(db.collection(SITE_FAQS_COLLECTION).doc(id), { order: index });
    });
  } else {
    const snap = await db.collection(SITE_FAQS_COLLECTION).get();
    const all = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        category: typeof data.category === "string" ? data.category : "general",
        order: typeof data.order === "number" ? data.order : 0,
      };
    });
    const others = all
      .filter((f) => f.category !== category)
      .sort((a, b) => a.order - b.order);
    const slots = all
      .filter((f) => f.category === category)
      .sort((a, b) => a.order - b.order)
      .map((f) => f.order);
    orderedIds.forEach((id, i) => {
      batch.update(db.collection(SITE_FAQS_COLLECTION).doc(id), {
        order: slots[i] ?? others.length + i,
      });
    });
  }
  await batch.commit();

  revalidatePath("/faq");
  revalidatePath("/sulphur-springs/q-and-a");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
