import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import { SITE_FAQS_COLLECTION } from "@/lib/site-faqs";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const faqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(8000),
  category: z.string().max(80).default("general"),
  order: z.number().int().min(0).optional(),
  active: z.boolean().default(true),
});

function bumpFaqCache(): void {
  revalidatePath("/faq");
  revalidatePath("/");
}

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snap = await getFirestore().collection(SITE_FAQS_COLLECTION).get();
  const faqs = snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        question: typeof data.question === "string" ? data.question : "",
        answer: typeof data.answer === "string" ? data.answer : "",
        category: typeof data.category === "string" ? data.category : "general",
        order: typeof data.order === "number" ? data.order : 0,
        active: data.active !== false,
      };
    })
    .sort((a, b) => a.order - b.order);

  return NextResponse.json({ faqs });
}

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

  const parsed = faqSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getFirestore();
  const existing = await db.collection(SITE_FAQS_COLLECTION).get();
  const maxOrder = existing.docs.reduce(
    (m, d) => Math.max(m, typeof d.get("order") === "number" ? d.get("order") : 0),
    -1,
  );
  const order = parsed.data.order ?? maxOrder + 1;

  const ref = db.collection(SITE_FAQS_COLLECTION).doc();
  await ref.set({
    question: parsed.data.question.trim(),
    answer: parsed.data.answer.trim(),
    category: parsed.data.category.trim() || "general",
    order,
    active: parsed.data.active,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: staff.email ?? staff.uid,
  });

  bumpFaqCache();
  return NextResponse.json({ ok: true, id: ref.id });
}
