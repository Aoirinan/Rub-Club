import type { Firestore } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { TIME_ZONE, type LocationId, type ServiceLine } from "./constants";
import { RESCHEDULE_HORIZON_DAYS, RESCHEDULE_MIN_LEAD_MINUTES } from "./booking-reschedule";
import { formatChicagoSlotChoice } from "./chicago-datetime-format";
import { providerAllowsAppointmentTime } from "./provider-scheduling";
import { providerHoursContext } from "./provider-profile";
import type { ProviderRow } from "./provider-types";
import {
  bucketDocIdsForAppointment,
  effectiveDayWindowsFromHours,
  enumerateCandidateStartsInWindows,
  holdBucketIdsForPublicBooking,
} from "./slots-luxon";

export type RescheduleSlot = { startIso: string; label: string };

/**
 * Open start times on `date` for moving an EXISTING booking, using the rules
 * the save (`updateBookingSchedule`) enforces: lead time and horizon, the
 * provider's hours, the visit's buffers, and admin holds. The booking's own
 * slot buckets count as free, so its current time is offered back.
 */
export async function listOpenStartsForExistingBooking(
  db: Firestore,
  params: {
    bookingId: string;
    locationId: LocationId;
    provider: ProviderRow;
    serviceLine: ServiceLine;
    durationMin: number;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    /** yyyy-MM-dd, Chicago. */
    date: string;
    now?: DateTime;
  },
): Promise<RescheduleSlot[]> {
  const { bookingId, locationId, provider, serviceLine, durationMin, date } = params;
  const now = (params.now ?? DateTime.now()).setZone(TIME_ZONE);
  const earliest = now.plus({ minutes: RESCHEDULE_MIN_LEAD_MINUTES });
  const latest = now.plus({ days: RESCHEDULE_HORIZON_DAYS });
  const buffers = {
    bufferBeforeMinutes: params.bufferBeforeMinutes,
    bufferAfterMinutes: params.bufferAfterMinutes,
  };

  const windows = effectiveDayWindowsFromHours(date, providerHoursContext(provider));
  const candidates = enumerateCandidateStartsInWindows(date, durationMin, windows).filter(
    (start) =>
      start >= earliest &&
      start <= latest &&
      providerAllowsAppointmentTime(provider, start, durationMin),
  );
  if (candidates.length === 0) return [];

  const idsPerStart = candidates.map((start) => [
    ...bucketDocIdsForAppointment(locationId, provider.id, start, durationMin, buffers),
    ...holdBucketIdsForPublicBooking(locationId, serviceLine, start, durationMin),
  ]);
  // One read for the whole day instead of one per candidate.
  const uniqueIds = [...new Set(idsPerStart.flat())];
  const snaps = await db.getAll(...uniqueIds.map((id) => db.collection("slot_buckets").doc(id)));
  // Holds carry no bookingId, so they block like any other visit's bucket.
  const blockedIds = new Set(
    snaps.filter((s) => s.exists && s.get("bookingId") !== bookingId).map((s) => s.id),
  );

  const out: RescheduleSlot[] = [];
  candidates.forEach((start, i) => {
    if (idsPerStart[i]!.some((id) => blockedIds.has(id))) return;
    out.push({ startIso: start.toUTC().toISO()!, label: formatChicagoSlotChoice(start) });
  });
  return out;
}
