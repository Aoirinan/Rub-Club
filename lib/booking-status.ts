export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled";

export const BOOKING_STATUSES: readonly BookingStatus[] = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
] as const;

export function isBookingStatus(value: unknown): value is BookingStatus {
  return (
    value === "pending" ||
    value === "confirmed" ||
    value === "declined" ||
    value === "cancelled"
  );
}

export function bookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "declined":
      return "Declined";
    case "cancelled":
      return "Cancelled";
  }
}

/** Tailwind class set for a status pill (background, border, text). */
export function bookingStatusPillClasses(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-50 border-amber-200 text-amber-900";
    case "confirmed":
      return "bg-emerald-50 border-emerald-200 text-emerald-900";
    case "declined":
      return "bg-slate-100 border-slate-200 text-slate-700";
    case "cancelled":
      return "bg-rose-50 border-rose-200 text-rose-900";
  }
}

/** Tailwind class set for a calendar block (background + ring + text). */
export function bookingStatusBlockClasses(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 ring-1 ring-amber-300 text-amber-950 hover:bg-amber-200";
    case "confirmed":
      return "bg-emerald-100 ring-1 ring-emerald-300 text-emerald-950 hover:bg-emerald-200";
    case "declined":
      return "bg-slate-100 ring-1 ring-slate-300 text-slate-600 line-through hover:bg-slate-200";
    case "cancelled":
      return "bg-rose-100 ring-1 ring-rose-300 text-rose-900 line-through hover:bg-rose-200";
  }
}

/** Whether the status counts as "live" (still occupies a time slot in the day view). */
export function isLiveStatus(status: BookingStatus): boolean {
  return status === "pending" || status === "confirmed";
}
