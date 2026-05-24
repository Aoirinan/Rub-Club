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
  needsReschedule?: boolean;
  patientId?: string;
  status?: BookingStatus;
  /** Online prepay flow (public booking). */
  prepaidOnline?: boolean;
  paymentLinkUrl?: string;
  paymentAmountCents?: number;
  paidAtMs?: number;
  paidAmountCents?: number;
  squarePaymentId?: string;
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
    | "survey_sent";
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
