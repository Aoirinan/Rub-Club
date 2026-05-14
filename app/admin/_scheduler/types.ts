import type { BookingStatus } from "@/lib/booking-status";

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
  providerId?: string;
  providerDisplayName?: string;
  providerMode?: string;
  preferredProviderId?: string;
  preferredProviderDisplayName?: string;
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: BookingStatus;
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

export type ProviderRow = {
  id: string;
  displayName: string;
  active: boolean;
  locationIds: string[];
  serviceLines: string[];
  sortOrder: number;
  schedule?: {
    openHour: number;
    openMinute: number;
    closeHour: number;
    closeMinute: number;
  } | null;
};

export type SchedulerView = "day" | "week" | "list";

export type StatusFilter = BookingStatus | "all";

export type FilterState = {
  view: SchedulerView;
  /** Chicago-local date in yyyy-MM-dd. */
  date: string;
  locationId: "all" | "paris" | "sulphur_springs";
  serviceLine: "all" | "massage" | "chiropractic";
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
