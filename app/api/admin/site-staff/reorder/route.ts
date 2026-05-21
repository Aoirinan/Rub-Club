import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { SITE_STAFF_CACHE_TAG, SITE_STAFF_COLLECTION } from "@/lib/site-staff";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const schema = z.object({
  orderedIds: z.array(z.string().min(1)),
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
  const batch = db.batch();
  parsed.data.orderedIds.forEach((id, index) => {
    batch.update(db.collection(SITE_STAFF_COLLECTION).doc(id), { order: index * 10 });
  });
  await batch.commit();

  revalidateTag(SITE_STAFF_CACHE_TAG);
  revalidatePath("/locations/paris/staff");
  revalidatePath("/sulphur-springs/staff");
  revalidatePath("/sulphur-springs");

  return NextResponse.json({ ok: true });
}
