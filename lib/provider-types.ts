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
  schedule?: ProviderDaySchedule | null;
};

export type ProviderRow = ProviderDoc & { id: string };
