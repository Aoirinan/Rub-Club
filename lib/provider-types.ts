import type { LocationId, ServiceLine } from "./constants";

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
  schedule?: ProviderDaySchedule | null;
};

export type ProviderRow = ProviderDoc & { id: string };
