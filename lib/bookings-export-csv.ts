import { Timestamp, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";
import { isBookingStatus, type BookingStatus } from "@/lib/booking-status";

function tsToChicago(value: unknown): string {
  if (value instanceof Timestamp) {
    return DateTime.fromMillis(value.toMillis()).setZone(TIME_ZONE).toFormat("yyyy-LL-dd hh:mm a");
  }
  return "";
}

export function escapeCsvCell(value: string): string {
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

export const BOOKING_EXPORT_CSV_HEADERS = [
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
] as const;

export function bookingRowToCsvCells(id: string, data: Record<string, unknown>): string[] {
  const status = isBookingStatus(data.status) ? data.status : "unknown";
  const startDt =
    data.startAt instanceof Timestamp
      ? DateTime.fromMillis(data.startAt.toMillis()).setZone(TIME_ZONE)
      : null;

  return [
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
    id,
  ];
}

export type BookingExportFilter = {
  statuses: BookingStatus[];
  locationId?: string | null;
};

export function buildBookingsExportCsv(docs: QueryDocumentSnapshot[], filter: BookingExportFilter): string {
  const lines: string[] = [BOOKING_EXPORT_CSV_HEADERS.map(escapeCsvCell).join(",")];

  for (const d of docs) {
    const data = d.data() as Record<string, unknown>;
    if (filter.statuses.length) {
      if (!isBookingStatus(data.status)) continue;
      if (!filter.statuses.includes(data.status)) continue;
    }
    if (filter.locationId && data.locationId !== filter.locationId) continue;
    lines.push(bookingRowToCsvCells(d.id, data).map(escapeCsvCell).join(","));
  }

  return lines.join("\n");
}
