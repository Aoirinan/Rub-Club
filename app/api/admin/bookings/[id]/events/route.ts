import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { listBookingEvents } from "@/lib/booking-events";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getFirestore();
  const bookingSnap = await db.collection("bookings").doc(id).get();
  if (!bookingSnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const events = await listBookingEvents(db, id);
  return NextResponse.json({ events });
}
