import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { authorizeOwnerMarketing, unauthorizedOwnerMarketing } from "@/lib/owner-marketing-auth";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const marketingAuth = await authorizeOwnerMarketing(req);
  if (!marketingAuth.ok) return unauthorizedOwnerMarketing();
  const { id } = await ctx.params;
  let body: { internalNotes?: string };
  try {
    body = (await req.json()) as { internalNotes?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const notes = typeof body.internalNotes === "string" ? body.internalNotes.slice(0, 2000) : "";
  const db = getFirestore();
  const ref = db.collection("bookings").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await ref.update({ internalNotes: notes });
  return NextResponse.json({ ok: true });
}
