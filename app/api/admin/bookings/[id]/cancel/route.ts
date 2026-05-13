import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getFirestore();
  const bookingRef = db.collection("bookings").doc(id);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) {
        throw new Error("not_found");
      }
      if (snap.get("status") === "cancelled") {
        return;
      }
      const bucketIds = snap.get("bucketIds") as string[] | undefined;
      if (bucketIds?.length) {
        for (const bid of bucketIds) {
          tx.delete(db.collection("slot_buckets").doc(bid));
        }
      }
      tx.update(bookingRef, {
        status: "cancelled",
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledByUid: staff.uid,
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Could not cancel" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
