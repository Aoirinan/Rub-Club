import type { LocationId, ServiceLine } from "./constants";
import type { ProviderBgColorId, ProviderTextColorId } from "./provider-colors";
import type {
  ProviderBlockOut,
  ProviderCalendarVisibility,
  ProviderNotificationWindows,
  ProviderWeeklyHours,
} from "./provider-profile";

/** Per-provider business hours override (same shape as global BUSINESS). */
export type ProviderDaySchedule = {
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
};

export type ProviderDoc = {
  displayName: string;
  active: boolean;
  locationIds: LocationId[];
  serviceLines: ServiceLine[];
  sortOrder: number;
  /** When false, hidden from public booking lists (existing clients / staff scheduling only). Default true. */
  acceptsNewClients: boolean;
  /** HTTPS URL shown on the public booking flow (optional). */
  photoUrl?: string | null;
  /** Short plain-text bio for the public booking flow (optional). */
  about?: string | null;
  /** Legacy single window — superseded by weeklyHours when set. */
  schedule?: ProviderDaySchedule | null;
  /** Per-day open/close (Chicago). Stored as providers/[id] field `hours` in Firestore. */
  weeklyHours?: ProviderWeeklyHours | null;
  blockOutTimes?: ProviderBlockOut[];
  notificationWindows?: ProviderNotificationWindows | null;
  /** Show on all location calendars or one office only. */
  calendarVisibility?: ProviderCalendarVisibility | null;
  /** Calendar block text color (admin Settings → Providers). */
  textColor?: ProviderTextColorId | null;
  /** Calendar block background color. */
  bgColor?: ProviderBgColorId | null;
};

export type ProviderRow = ProviderDoc & { id: string };
