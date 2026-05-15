import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { isBookingStatus } from "@/lib/booking-status";
import { TIME_ZONE } from "@/lib/constants";

export const runtime = "nodejs";

function tsToChicago(value: unknown): string {
  if (value instanceof Timestamp) {
    return DateTime.fromMillis(value.toMillis()).setZone(TIME_ZONE).toFormat("yyyy-LL-dd hh:mm a");
  }
  return "";
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function prettyLocation(id: string | undefined): string {
  if (id === "paris") return "Paris, TX";
  if (id === "sulphur_springs") return "Sulphur Springs, TX";
  return id ?? "";
}

function payStatusLabel(data: Record<string, unknown>): string {
  const paid = data.paidAmountCents;
  if (typeof paid === "number" && paid > 0) return "Paid";
  if (typeof data.paymentLinkUrl === "string" && data.paymentLinkUrl.length > 0) return "Pay link";
  if (data.prepaidOnline === true) return "Prepay";
  return "";
}

function paidAmountDollars(data: Record<string, unknown>): string {
  const cents = data.paidAmountCents;
  if (typeof cents !== "number" || cents <= 0) return "";
  return (cents / 100).toFixed(2);
}

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

  const statuses = statusStr
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

  const headers = [
    "Date",
    "Time",
    "Patient Name",
    "Phone",
    "Email",
    "Service",
    "Duration (min)",
    "Provider",
    "Location",
    "Status",
    "Patient notes",
    "Internal notes",
    "Online confirm",
    "Checked in",
    "Needs reschedule",
    "Pay status",
    "Paid amount",
    "Paid at (Chicago)",
    "Square payment ID",
    "Created",
    "Booking ID",
  ];

  const rows: string[] = [headers.map(escapeCsv).join(",")];

  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const status = isBookingStatus(data.status) ? data.status : "unknown";
    if (statuses.length && !statuses.includes(status as never)) continue;
    if (locationId && data.locationId !== locationId) continue;

    const startDt = data.startAt instanceof Timestamp
      ? DateTime.fromMillis(data.startAt.toMillis()).setZone(TIME_ZONE)
      : null;

    const row = [
      startDt?.toFormat("yyyy-LL-dd") ?? "",
      startDt?.toFormat("h:mm a") ?? "",
      typeof data.name === "string" ? data.name : "",
      typeof data.phone === "string" ? data.phone : "",
      typeof data.email === "string" ? data.email : "",
      typeof data.serviceLine === "string" ? data.serviceLine : "",
      typeof data.durationMin === "number" ? String(data.durationMin) : "",
      typeof data.providerDisplayName === "string" ? data.providerDisplayName : "",
      prettyLocation(typeof data.locationId === "string" ? data.locationId : undefined),
      status,
      typeof data.notes === "string" ? data.notes : "",
      typeof data.internalNotes === "string" ? data.internalNotes : "",
      typeof data.confirmationStatus === "string" ? data.confirmationStatus : "",
      tsToChicago(data.checkedInAt),
      data.needsReschedule === true ? "yes" : data.needsReschedule === false ? "no" : "",
      payStatusLabel(data),
      paidAmountDollars(data),
      tsToChicago(data.paidAt),
      typeof data.squarePaymentId === "string" ? data.squarePaymentId : "",
      tsToChicago(data.createdAt),
      d.id,
    ];

    rows.push(row.map(escapeCsv).join(","));
  }

  const csv = rows.join("\n");
  const filename = `bookings-export-${DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
