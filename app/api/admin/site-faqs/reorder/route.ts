import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import { SITE_FAQS_COLLECTION } from "@/lib/site-faqs";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const schema = z.object({
  orderedIds: z.array(z.string().min(1)),
});

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
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
  const batch = db.batch();
  parsed.data.orderedIds.forEach((id, index) => {
    batch.update(db.collection(SITE_FAQS_COLLECTION).doc(id), { order: index });
  });
  await batch.commit();

  revalidatePath("/faq");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
