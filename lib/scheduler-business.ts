import type { LocationId, ServiceLine } from "@/lib/constants";
import type { ProviderBgColorId, ProviderTextColorId } from "@/lib/provider-colors";

export const SCHEDULER_BUSINESS_IDS = [
  "all",
  "rub_club",
  "paris_chiro",
  "sulphur_springs",
] as const;

export type SchedulerBusinessId = (typeof SCHEDULER_BUSINESS_IDS)[number];

export const SCHEDULER_BUSINESS_STORAGE_KEY = "scheduler-business-filter";

export const SCHEDULER_BUSINESS_LABELS: Record<SchedulerBusinessId, string> = {
  all: "All",
  rub_club: "The Rub Club - Massage",
  paris_chiro: "Paris Chiropractic",
  sulphur_springs: "Sulphur Springs",
};

export function isSchedulerBusinessId(v: unknown): v is SchedulerBusinessId {
  return typeof v === "string" && (SCHEDULER_BUSINESS_IDS as readonly string[]).includes(v);
}

export function readSchedulerBusinessFromSession(): SchedulerBusinessId {
  if (typeof window === "undefined") return "all";
  try {
    const v = sessionStorage.getItem(SCHEDULER_BUSINESS_STORAGE_KEY);
    if (isSchedulerBusinessId(v)) return v;
  } catch {
    /* ignore */
  }
  return "all";
}

export function writeSchedulerBusinessToSession(business: SchedulerBusinessId): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SCHEDULER_BUSINESS_STORAGE_KEY, business);
  } catch {
    /* ignore */
  }
}

type BookingLike = {
  locationId?: string;
  serviceLine?: string;
};

type ProviderLike = {
  locationIds: LocationId[];
  serviceLines: ServiceLine[];
};

export function bookingMatchesSchedulerBusiness(
  booking: BookingLike,
  business: SchedulerBusinessId,
): boolean {
  if (business === "all") return true;
  const loc = booking.locationId;
  const svc = booking.serviceLine;
  if (business === "rub_club") {
    return loc === "paris" && (svc === "massage" || svc === "stretch");
  }
  if (business === "paris_chiro") {
    return loc === "paris" && svc === "chiropractic";
  }
  if (business === "sulphur_springs") {
    return loc === "sulphur_springs";
  }
  return true;
}

export function providerMatchesSchedulerBusiness(
  provider: ProviderLike,
  business: SchedulerBusinessId,
): boolean {
  if (business === "all") return true;
  if (business === "rub_club") {
    return (
      provider.locationIds.includes("paris") &&
      (provider.serviceLines.includes("massage") || provider.serviceLines.includes("stretch"))
    );
  }
  if (business === "paris_chiro") {
    return provider.locationIds.includes("paris") && provider.serviceLines.includes("chiropractic");
  }
  if (business === "sulphur_springs") {
    return provider.locationIds.includes("sulphur_springs");
  }
  return true;
}

/** Map business filter to location/service for API queries when possible. */
export function schedulerBusinessToApiHints(business: SchedulerBusinessId): {
  locationId?: LocationId;
} {
  if (business === "paris_chiro" || business === "rub_club") {
    return { locationId: "paris" };
  }
  if (business === "sulphur_springs") {
    return { locationId: "sulphur_springs" };
  }
  return {};
}

export type { ProviderTextColorId, ProviderBgColorId };
