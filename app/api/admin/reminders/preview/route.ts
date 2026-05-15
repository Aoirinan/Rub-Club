import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { formatChicagoDateTimeLong } from "@/lib/chicago-datetime-format";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getFirestore();
  const now = Date.now();
  const windowStart = Timestamp.fromMillis(now + 22 * 60 * 60 * 1000);
  const windowEnd = Timestamp.fromMillis(now + 26 * 60 * 60 * 1000);

  const snap = await db
    .collection("bookings")
    .where("status", "==", "confirmed")
    .where("startAt", ">=", windowStart)
    .where("startAt", "<=", windowEnd)
    .limit(200)
    .get();

  const byPhoneDay = new Map<string, { docId: string; startMs: number }>();
  for (const doc of snap.docs) {
    const data = doc.data();
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const startAt = data.startAt as Timestamp | undefined;
    if (!phone || !startAt) continue;
    const startMs = startAt.toMillis();
    const dayKey = new Date(startMs).toISOString().slice(0, 10);
    const digits = phone.replace(/\D/g, "").slice(-10);
    const key = `${digits}__${dayKey}`;
    const prev = byPhoneDay.get(key);
    if (!prev || startMs < prev.startMs) {
      byPhoneDay.set(key, { docId: doc.id, startMs });
    }
  }

  const rows: { bookingId: string; name: string; phone: string; when: string }[] = [];
  for (const { docId } of byPhoneDay.values()) {
    const doc = await db.collection("bookings").doc(docId).get();
    const events = await db
      .collection("bookings")
      .doc(docId)
      .collection("events")
      .where("type", "==", "reminder_sent")
      .limit(1)
      .get();
    if (!events.empty) continue;
    const ctx = bookingDocToEmailContext(doc);
    if (!ctx) continue;
    rows.push({
      bookingId: docId,
      name: ctx.name,
      phone: ctx.phone,
      when: formatChicagoDateTimeLong(ctx.start),
    });
  }

  return NextResponse.json({ count: rows.length, rows });
}
