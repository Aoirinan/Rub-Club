import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { SITE_STAFF_CACHE_TAG, SITE_STAFF_COLLECTION } from "@/lib/site-staff";
import { listSiteStaffMembers } from "@/lib/site-staff-data";
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
  const existing = await listSiteStaffMembers(db);
  const knownIds = new Set(existing.map((m) => m.id));
  const orderedIds = parsed.data.orderedIds;

  // Reject partial or unknown payloads so a stale admin tab can't 500 the batch
  // or leave omitted members with colliding order values.
  const unknown = orderedIds.filter((id) => !knownIds.has(id));
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: `Unknown staff member id(s): ${unknown.join(", ")}` },
      { status: 400 },
    );
  }
  if (new Set(orderedIds).size !== orderedIds.length) {
    return NextResponse.json({ error: "Duplicate ids in ordering" }, { status: 400 });
  }
  if (orderedIds.length !== existing.length) {
    return NextResponse.json(
      { error: "Ordering must include every staff member. Refresh and try again." },
      { status: 409 },
    );
  }

  const batch = db.batch();
  orderedIds.forEach((id, index) => {
    batch.update(db.collection(SITE_STAFF_COLLECTION).doc(id), { order: index * 10 });
  });
  await batch.commit();

  revalidateTag(SITE_STAFF_CACHE_TAG);
  revalidatePath("/locations/paris/staff");
  revalidatePath("/sulphur-springs/staff");
  revalidatePath("/sulphur-springs");
  revalidatePath("/sulphur-springs/massage");

  return NextResponse.json({ ok: true });
}
