import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const db = getFirestore();
  const holdRef = db.collection("slot_holds").doc(id);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(holdRef);
      if (!snap.exists) throw new Error("not_found");
      const data = snap.data() ?? {};
      const bucketIds: string[] = Array.isArray(data.bucketIds) ? data.bucketIds : [];
      for (const bid of bucketIds) {
        tx.delete(db.collection("slot_buckets").doc(bid));
      }
      tx.delete(holdRef);
    });
  } catch (e) {
    if (e instanceof Error && e.message === "not_found") {
      return NextResponse.json({ error: "Hold not found" }, { status: 404 });
    }
    console.error("[admin/holds DELETE]", e);
    return NextResponse.json({ error: "Could not delete hold" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
