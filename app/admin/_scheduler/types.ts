import type { BookingStatus } from "@/lib/booking-status";
import type { SchedulerBusinessId } from "@/lib/scheduler-business";

export type { ProviderRow } from "@/lib/provider-types";

export type StaffActor = {
  uid: string | null;
  email: string | null;
  atIso: string | null;
  reason: string | null;
};

export type BookingRow = {
  id: string;
  startIso?: string;
  startAtMs?: number;
  locationId?: string;
  serviceLine?: string;
  durationMin?: number;
  schedulerServiceId?: string;
  serviceTypeName?: string;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  providerId?: string;
  providerDisplayName?: string;
  providerMode?: string;
  preferredProviderId?: string;
  preferredProviderDisplayName?: string;
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  internalNotes?: string;
  /** Patient tapped /confirm link (SMS). */
  confirmationStatus?: string;
  checkedInAtMs?: number;
  /** Marked a no-show at the desk (never set together with a check-in). */
  noShow?: boolean;
  noShowAtMs?: number;
  noShowByEmail?: string;
  needsReschedule?: boolean;
  patientId?: string;
  status?: BookingStatus;
  /** Online prepay flow (public booking). */
  prepaidOnline?: boolean;
  paymentLinkUrl?: string;
  paymentAmountCents?: number;
  /** Paid = `paidAtMs` set, or (older online payments) `paidAmountCents` > 0. */
  paidAtMs?: number;
  paidAmountCents?: number;
  squarePaymentId?: string;
  /** "card" | "cash" | "check" | "other" (desk) or "square_online" (webhook). */
  paymentMethod?: string;
  paymentNote?: string;
  paymentRecordedByEmail?: string;
  accepted?: StaffActor;
  declined?: StaffActor;
  cancelled?: StaffActor;
  createdAtMs?: number;
};

export type BookingEvent = {
  id: string;
  type:
    | "created"
    | "accepted"
    | "declined"
    | "cancelled"
    | "note"
    | "reminder_sent"
    | "payment_requested"
    | "payment_completed"
    | "custom_email"
    | "rescheduled"
    | "survey_sent"
    | "payment_recorded"
    | "payment_cleared"
    | "no_show_marked"
    | "no_show_cleared";
  atIso: string | null;
  byUid: string | null;
  byEmail: string | null;
  reason?: string;
  meta?: Record<string, unknown>;
  prevStatus?: BookingStatus;
};

export type SchedulerView = "day" | "week" | "list";

export type StatusFilter = BookingStatus | "all";

export type FilterState = {
  view: SchedulerView;
  /** Chicago-local date in yyyy-MM-dd. */
  date: string;
  /** Persisted in sessionStorage — not in URL. */
  business: SchedulerBusinessId;
  locationId: "all" | "paris" | "sulphur_springs";
  /** Massage + stretch combined (main desk scheduler). */
  serviceLine: "all" | "bodywork" | "massage" | "chiropractic" | "stretch";
  providerId: "all" | string;
  statuses: ReadonlyArray<BookingStatus>;
  q: string;
};

export const DEFAULT_STATUSES: ReadonlyArray<BookingStatus> = [
  "pending",
  "confirmed",
];

export const ALL_STATUSES: ReadonlyArray<BookingStatus> = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
];
