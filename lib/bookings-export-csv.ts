import { Timestamp, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";
import { isBookingStatus, type BookingStatus } from "@/lib/booking-status";
import {
  bookingIsPaid,
  effectivePaymentMethod,
  paymentMethodLabel,
  type BookingPaymentState,
} from "@/lib/booking-payment";

function tsToChicago(value: unknown): string {
  if (value instanceof Timestamp) {
    return DateTime.fromMillis(value.toMillis()).setZone(TIME_ZONE).toFormat("yyyy-LL-dd hh:mm a");
  }
  return "";
}

export function escapeCsvCell(value: string): string {
  // Neutralize spreadsheet formula injection: a leading = + - @ or control
  // character would otherwise be evaluated when opened in Excel / Sheets.
  const v = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (v.includes(",") || v.includes('"') || v.includes("\n") || v.includes("\r") || v.startsWith("'")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function prettyLocation(id: string | undefined): string {
  if (id === "paris") return "Paris, TX";
  if (id === "sulphur_springs") return "Sulphur Springs, TX";
  return id ?? "";
}

function paymentState(data: Record<string, unknown>): BookingPaymentState {
  return {
    paidAtMs: data.paidAt instanceof Timestamp ? data.paidAt.toMillis() : null,
    paidAmountCents: typeof data.paidAmountCents === "number" ? data.paidAmountCents : null,
    paymentMethod: typeof data.paymentMethod === "string" ? data.paymentMethod : null,
    squarePaymentId: typeof data.squarePaymentId === "string" ? data.squarePaymentId : null,
  };
}

function payStatusLabel(data: Record<string, unknown>): string {
  if (bookingIsPaid(paymentState(data))) return "Paid";
  if (typeof data.paymentLinkUrl === "string" && data.paymentLinkUrl.length > 0) return "Pay link";
  if (data.prepaidOnline === true) return "Prepay";
  return "";
}

/** Card / Cash / Check / Other / Online (Square), for paid visits only. */
function payMethodLabel(data: Record<string, unknown>): string {
  const state = paymentState(data);
  return bookingIsPaid(state) ? paymentMethodLabel(effectivePaymentMethod(state)) : "";
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
  "No-show",
  "Needs reschedule",
  "Pay status",
  "Payment method",
  "Paid amount",
  "Paid at (Chicago)",
  "Payment recorded by",
  "Payment note",
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
    data.noShow === true ? "yes" : "",
    data.needsReschedule === true ? "yes" : data.needsReschedule === false ? "no" : "",
    payStatusLabel(data),
    payMethodLabel(data),
    paidAmountDollars(data),
    tsToChicago(data.paidAt),
    typeof data.paymentRecordedByEmail === "string" ? data.paymentRecordedByEmail : "",
    typeof data.paymentNote === "string" ? data.paymentNote : "",
    typeof data.squarePaymentId === "string" ? data.squarePaymentId : "",
    tsToChicago(data.createdAt),
    id,
  ];
}

export type BookingExportFilter = {
  statuses: BookingStatus[];
  locationId?: string | null;
  providerId?: string | null;
  /** Free-text search (same fields as the scheduler list). */
  q?: string | null;
};

function matchesExportQuery(id: string, data: Record<string, unknown>, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    data.name,
    data.phone,
    data.email,
    data.providerDisplayName,
    id,
    data.notes,
    data.internalNotes,
    data.squarePaymentId,
  ]
    .filter((s): s is string => typeof s === "string")
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function buildBookingsExportCsv(docs: QueryDocumentSnapshot[], filter: BookingExportFilter): string {
  const lines: string[] = [BOOKING_EXPORT_CSV_HEADERS.map(escapeCsvCell).join(",")];

  for (const d of docs) {
    const data = d.data() as Record<string, unknown>;
    if (filter.statuses.length) {
      if (!isBookingStatus(data.status)) continue;
      if (!filter.statuses.includes(data.status)) continue;
    }
    if (filter.locationId && data.locationId !== filter.locationId) continue;
    if (filter.providerId && data.providerId !== filter.providerId) continue;
    if (filter.q && !matchesExportQuery(d.id, data, filter.q)) continue;
    lines.push(bookingRowToCsvCells(d.id, data).map(escapeCsvCell).join(","));
  }

  return lines.join("\n");
}
