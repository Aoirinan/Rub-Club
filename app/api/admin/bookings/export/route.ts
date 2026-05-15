import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { buildBookingsExportCsv } from "@/lib/bookings-export-csv";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { isBookingStatus, type BookingStatus } from "@/lib/booking-status";
import { TIME_ZONE } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const statusStr = searchParams.get("status");
  const locationId = searchParams.get("locationId");

  const from = fromStr
    ? Timestamp.fromMillis(Date.parse(fromStr))
    : Timestamp.fromMillis(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const to = toStr
    ? Timestamp.fromMillis(Date.parse(toStr))
    : Timestamp.fromMillis(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const statuses: BookingStatus[] = statusStr
    ? statusStr.split(",").map((s) => s.trim()).filter(isBookingStatus)
    : [];

  const db = getFirestore();
  const snap = await db
    .collection("bookings")
    .where("startAt", ">=", from)
    .where("startAt", "<=", to)
    .orderBy("startAt", "asc")
    .limit(5000)
    .get();

  const csv = buildBookingsExportCsv(snap.docs, {
    statuses,
    locationId: locationId || null,
  });
  const filename = `bookings-export-${DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
