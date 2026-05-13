import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const from = fromStr
    ? Timestamp.fromMillis(Date.parse(fromStr))
    : Timestamp.fromMillis(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const to = toStr
    ? Timestamp.fromMillis(Date.parse(toStr))
    : Timestamp.fromMillis(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const db = getFirestore();
  const snap = await db
    .collection("bookings")
    .where("startAt", ">=", from)
    .where("startAt", "<=", to)
    .orderBy("startAt", "asc")
    .limit(500)
    .get();

  const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ bookings });
}
