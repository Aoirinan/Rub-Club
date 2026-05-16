import type { BookingStatus } from "@/lib/booking-status";

export type VisitDisplayStatus =
  | "completed"
  | "confirmed"
  | "cancelled"
  | "no_show"
  | "pending"
  | "declined";

export function deriveVisitDisplayStatus(booking: {
  status?: string;
  startAtMs?: number | null;
  checkedInAtMs?: number | null;
  visitNoShow?: boolean;
}): VisitDisplayStatus {
  const status = (booking.status ?? "pending") as BookingStatus | string;
  if (status === "cancelled") return "cancelled";
  if (status === "declined") return "declined";
  if (typeof booking.checkedInAtMs === "number") return "completed";
  if (booking.visitNoShow === true) return "no_show";
  if (status === "pending") return "pending";
  if (status === "confirmed") {
    const start = booking.startAtMs;
    if (typeof start === "number" && start < Date.now() && !booking.checkedInAtMs) {
      return "no_show";
    }
    return "confirmed";
  }
  return "pending";
}

export function visitDisplayStatusLabel(s: VisitDisplayStatus): string {
  switch (s) {
    case "completed":
      return "Completed";
    case "confirmed":
      return "Confirmed";
    case "cancelled":
      return "Canceled";
    case "no_show":
      return "No Show";
    case "pending":
      return "Pending";
    case "declined":
      return "Declined";
  }
}

export function visitDisplayStatusClasses(s: VisitDisplayStatus): string {
  switch (s) {
    case "completed":
      return "bg-emerald-50 border-emerald-200 text-emerald-900";
    case "confirmed":
      return "bg-teal-50 border-teal-200 text-teal-900";
    case "cancelled":
      return "bg-rose-50 border-rose-200 text-rose-900";
    case "no_show":
      return "bg-orange-50 border-orange-200 text-orange-900";
    case "pending":
      return "bg-slate-100 border-slate-200 text-slate-700";
    case "declined":
      return "bg-slate-100 border-slate-200 text-slate-600";
  }
}
