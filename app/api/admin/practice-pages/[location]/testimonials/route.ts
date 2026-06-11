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
  parsePracticeTestimonialDoc,
  type PracticeLocationId,
} from "@/lib/practice-pages-shared";

export const runtime = "nodejs";

const testimonialSchema = z.object({
  name: z.string().max(200).default(""),
  context: z.string().max(200).default(""),
  quote: z.string().min(1).max(4000),
  order: z.number().int().min(0).optional(),
  published: z.boolean().default(false),
});

function testimonialsCol(loc: PracticeLocationId) {
  return getFirestore()
    .collection(PRACTICE_PAGES_COLLECTION)
    .doc(loc)
    .collection(PRACTICE_TESTIMONIALS_SUBCOLLECTION);
}

export async function GET(
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

  const snap = await testimonialsCol(location).get();
  const testimonials = snap.docs
    .map((d) => parsePracticeTestimonialDoc(d.id, d.data()))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  return NextResponse.json({ testimonials });
}

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

  const parsed = testimonialSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const col = testimonialsCol(location);
  const existing = await col.get();
  const maxOrder = existing.docs.reduce(
    (m, d) => Math.max(m, typeof d.get("order") === "number" ? d.get("order") : 0),
    -1,
  );
  const order = parsed.data.order ?? maxOrder + 1;

  const ref = col.doc();
  await ref.set({
    name: parsed.data.name.trim(),
    context: parsed.data.context.trim(),
    quote: parsed.data.quote.trim(),
    order,
    published: parsed.data.published,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: staff.email ?? staff.uid,
  });

  revalidatePath(PRACTICE_PAGE_PATHS[location]);
  return NextResponse.json({ ok: true, id: ref.id });
}
