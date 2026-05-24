import type { DateTime } from "luxon";
import { appointmentBlockedByBlockOut } from "./provider-blockouts";
import { providerHoursContext, type ProviderHoursContext } from "./provider-profile";
import type { ProviderRow } from "./provider-types";
import { isWithinProviderHours } from "./slots-luxon";

export function hoursContextForProvider(provider: ProviderRow): ProviderHoursContext {
  return providerHoursContext(provider);
}

export function providerAllowsAppointmentTime(
  provider: ProviderRow,
  start: DateTime,
  durationMin: number,
): boolean {
  const ctx = hoursContextForProvider(provider);
  if (!isWithinProviderHours(start, durationMin, ctx)) return false;
  if (appointmentBlockedByBlockOut(start, durationMin, provider.blockOutTimes ?? [], ctx)) {
    return false;
  }
  return true;
}
