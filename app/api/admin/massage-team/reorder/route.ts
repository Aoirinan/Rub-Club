import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import {
  listMassageTeamMembers,
  MASSAGE_TEAM_CACHE_TAG,
  MASSAGE_TEAM_COLLECTION,
} from "@/lib/massage-team";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const schema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
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
  const existing = await listMassageTeamMembers(db);
  const knownIds = new Set(existing.map((m) => m.id));
  const orderedIds = parsed.data.orderedIds;

  // Reject partial or unknown payloads so a stale admin tab can't silently
  // drop members out of the ordering.
  const unknown = orderedIds.filter((id) => !knownIds.has(id));
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: `Unknown team member id(s): ${unknown.join(", ")}` },
      { status: 400 },
    );
  }
  if (new Set(orderedIds).size !== orderedIds.length) {
    return NextResponse.json({ error: "Duplicate ids in ordering" }, { status: 400 });
  }
  if (orderedIds.length !== existing.length) {
    return NextResponse.json(
      { error: "Ordering must include every team member. Refresh and try again." },
      { status: 409 },
    );
  }

  const batch = db.batch();
  orderedIds.forEach((id, index) => {
    batch.update(db.collection(MASSAGE_TEAM_COLLECTION).doc(id), {
      sortOrder: index * 10,
    });
  });
  await batch.commit();

  revalidateTag(MASSAGE_TEAM_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/services/massage");

  const members = await listMassageTeamMembers(db);
  return NextResponse.json({ ok: true, members });
}
