import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import type { LocationId, ServiceLine } from "./constants";
import { TIME_ZONE } from "./constants";
import { recordBookingEventInTx } from "./booking-events";
import type { BookingStatus } from "./booking-status";
import { isValidBookingDurationMin } from "./booking-duration";
import { providerAllowsAppointmentTime } from "./provider-scheduling";
import { fetchActiveProvidersForService } from "./providers-db";
import { fetchSchedulerServiceById } from "./scheduler-services-db";
import {
  bucketDocIdsForAppointment,
  holdBucketIdsForPublicBooking,
  isAlignedToSlotGrid,
  parseStartIsoToDateTime,
} from "./slots-luxon";

export type RescheduleFailureCode =
  | "not_found"
  | "bad_status"
  | "invalid_time"
  | "no_provider"
  | "outside_hours"
  | "slot_taken"
  | "slot_blocked"
  | "invalid_duration"
  | "unknown_service"
  | "server_error";

export type RescheduleSuccess = {
  ok: true;
  prevStartIso: string;
  newStartIso: string;
  /**
   * True when the START TIME moved. Callers use this to decide whether to email
   * the patient, so it must stay time-only even when other fields changed.
   */
  changed: boolean;
  providerChanged: boolean;
  serviceChanged: boolean;
  /** True when any scheduled field (time, provider, service, duration) moved. */
  anyChange: boolean;
};

export type RescheduleResult =
  | RescheduleSuccess
  | { ok: false; code: RescheduleFailureCode; status: number };

/**
 * Fields an admin edit may override. Anything omitted keeps the booking's
 * current value, so passing only `startIso` is a plain reschedule.
 */
export type BookingScheduleChanges = {
  startIso?: string;
  providerId?: string;
  serviceLine?: ServiceLine;
  durationMin?: number;
  /** When set, duration and buffers default to this catalog service. */
  schedulerServiceId?: string;
};

function isBookingFieldOk(
  locationId: unknown,
  serviceLine: unknown,
  durationMin: unknown,
): locationId is LocationId {
  return (
    (locationId === "paris" || locationId === "sulphur_springs") &&
    (serviceLine === "massage" || serviceLine === "chiropractic" || serviceLine === "stretch") &&
    typeof durationMin === "number" &&
    Number.isInteger(durationMin) &&
    durationMin > 0 &&
    durationMin <= 480
  );
}

function numberOr(raw: unknown, fallback: number): number {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
}

/**
 * Move a booking to a new start time (same provider, same service). Kept as the
 * patient-portal entry point: behaviour is identical to passing only `startIso`
 * to `updateBookingSchedule`.
 */
export async function rescheduleBookingForStartChange(
  db: Firestore,
  bookingId: string,
  startIso: string,
  actor: { uid: string | null; email: string | null },
  options: { allowPending: boolean },
): Promise<RescheduleResult> {
  return updateBookingSchedule(db, bookingId, { startIso }, actor, options);
}

/**
 * Change a booking's time and/or provider, service line, duration and catalog
 * service in one transaction. Slot buckets are re-checked against the NEW
 * provider/duration/buffers, and only buckets this booking actually owns are
 * released (a booking created with "allow double-booking" lists none).
 */
export async function updateBookingSchedule(
  db: Firestore,
  bookingId: string,
  changes: BookingScheduleChanges,
  actor: { uid: string | null; email: string | null },
  options: { allowPending: boolean },
): Promise<RescheduleResult> {
  const bookingRef = db.collection("bookings").doc(bookingId);
  const preSnap = await bookingRef.get();
  if (!preSnap.exists) {
    return { ok: false, code: "not_found", status: 404 };
  }
  const d = preSnap.data()!;
  const status = d.status as BookingStatus | undefined;
  if (options.allowPending) {
    if (status !== "confirmed" && status !== "pending") {
      return { ok: false, code: "bad_status", status: 409 };
    }
  } else if (status !== "confirmed") {
    return { ok: false, code: "bad_status", status: 409 };
  }

  const curProviderId = typeof d.providerId === "string" ? d.providerId.trim() : "";
  const targetProviderId = (changes.providerId ?? curProviderId).trim();
  if (!targetProviderId) {
    return { ok: false, code: "no_provider", status: 400 };
  }

  const locationId = d.locationId;
  const curServiceLine = d.serviceLine;
  const curDurationMin = d.durationMin;
  if (!isBookingFieldOk(locationId, curServiceLine, curDurationMin)) {
    return { ok: false, code: "bad_status", status: 409 };
  }

  const targetServiceLine = (changes.serviceLine ?? curServiceLine) as ServiceLine;

  // A catalog service supplies the default duration and the buffers that decide
  // how many slot buckets the visit occupies.
  const curSchedulerServiceId =
    typeof d.schedulerServiceId === "string" && d.schedulerServiceId.trim()
      ? d.schedulerServiceId.trim()
      : undefined;
  // An empty string from the editor means "no catalog service" — normalise it
  // to undefined so the field is deleted rather than blanked.
  const rawTargetServiceId = changes.schedulerServiceId ?? curSchedulerServiceId;
  const targetSchedulerServiceId =
    typeof rawTargetServiceId === "string" && rawTargetServiceId.trim()
      ? rawTargetServiceId.trim()
      : undefined;
  const serviceChangedId = targetSchedulerServiceId !== curSchedulerServiceId;

  let targetServiceName: string | undefined =
    typeof d.serviceTypeName === "string" ? d.serviceTypeName : undefined;
  let targetBufferBefore = numberOr(d.bufferBeforeMinutes, 0);
  let targetBufferAfter = numberOr(d.bufferAfterMinutes, 0);
  let serviceDefaultDuration: number | undefined;

  if (targetSchedulerServiceId) {
    if (serviceChangedId) {
      const svcRow = await fetchSchedulerServiceById(db, targetSchedulerServiceId);
      if (!svcRow) {
        return { ok: false, code: "unknown_service", status: 400 };
      }
      targetServiceName = svcRow.name;
      targetBufferBefore = svcRow.bufferBeforeMinutes ?? 0;
      targetBufferAfter = svcRow.bufferAfterMinutes ?? 0;
      serviceDefaultDuration = svcRow.durationMinutes;
    }
  } else if (serviceChangedId) {
    // Cleared the catalog service: drop its name and buffers.
    targetServiceName = undefined;
    targetBufferBefore = 0;
    targetBufferAfter = 0;
  }

  const targetDurationMin =
    changes.durationMin ?? serviceDefaultDuration ?? (curDurationMin as number);
  const durationChanged = targetDurationMin !== curDurationMin;
  // Only hold a changed duration to the 30-minute slot grid — existing bookings
  // may legitimately carry an off-grid length from an older catalog entry.
  if (durationChanged && !isValidBookingDurationMin(targetDurationMin)) {
    return { ok: false, code: "invalid_duration", status: 400 };
  }
  if (!isBookingFieldOk(locationId, targetServiceLine, targetDurationMin)) {
    return { ok: false, code: "bad_status", status: 409 };
  }

  const prevStartIso = typeof d.startIso === "string" ? d.startIso : "";
  const targetStartRaw = changes.startIso ?? prevStartIso;
  const newStart = parseStartIsoToDateTime(targetStartRaw);
  if (!newStart || !isAlignedToSlotGrid(newStart)) {
    return { ok: false, code: "invalid_time", status: 400 };
  }
  const newStartIso = newStart.toUTC().toISO()!;

  // A booking with no stored start is being given one, so that counts as a move.
  const timeChanged = !prevStartIso || newStartIso !== prevStartIso;
  const providerChanged = targetProviderId !== curProviderId;
  const serviceChanged =
    targetServiceLine !== curServiceLine || durationChanged || serviceChangedId;
  const anyChange = timeChanged || providerChanged || serviceChanged;

  if (!anyChange) {
    return {
      ok: true,
      prevStartIso,
      newStartIso,
      changed: false,
      providerChanged: false,
      serviceChanged: false,
      anyChange: false,
    };
  }

  // Past / horizon bounds apply only when the appointment actually moves, so a
  // provider swap on a booking happening in ten minutes still works.
  if (timeChanged) {
    const now = DateTime.now().setZone(TIME_ZONE);
    if (newStart < now.plus({ minutes: 2 })) {
      return { ok: false, code: "invalid_time", status: 400 };
    }
    if (newStart > now.plus({ days: 90 })) {
      return { ok: false, code: "invalid_time", status: 400 };
    }
  }

  const eligible = await fetchActiveProvidersForService(db, locationId, targetServiceLine);
  const provider = eligible.find((p) => p.id === targetProviderId);
  if (!provider) {
    return { ok: false, code: "no_provider", status: 400 };
  }
  if (!providerAllowsAppointmentTime(provider, newStart, targetDurationMin)) {
    return { ok: false, code: "outside_hours", status: 400 };
  }

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) {
        throw new Error("not_found_tx");
      }
      const st = snap.get("status") as BookingStatus | undefined;
      if (options.allowPending) {
        if (st !== "confirmed" && st !== "pending") {
          throw new Error("bad_status");
        }
      } else if (st !== "confirmed") {
        throw new Error("bad_status");
      }

      const locId = snap.get("locationId");
      if (!isBookingFieldOk(locId, targetServiceLine, targetDurationMin)) {
        throw new Error("bad_status");
      }

      const oldBucketIds = (snap.get("bucketIds") as string[]) ?? [];
      const nb = bucketDocIdsForAppointment(locId, targetProviderId, newStart, targetDurationMin, {
        bufferBeforeMinutes: targetBufferBefore,
        bufferAfterMinutes: targetBufferAfter,
      });
      // Same hold scoping as slot listing and admin create (stretch also
      // honors massage-scope holds).
      const hids = holdBucketIdsForPublicBooking(
        locId,
        targetServiceLine,
        newStart,
        targetDurationMin,
      );
      const bucketRefs = nb.map((id) => db.collection("slot_buckets").doc(id));
      const holdRefs = hids.map((id) => db.collection("slot_buckets").doc(id));
      const combined = [...bucketRefs, ...holdRefs];
      const oldBucketRefs = oldBucketIds.map((id) => db.collection("slot_buckets").doc(id));
      const [reads, oldReads] = await Promise.all([
        Promise.all(combined.map((r) => tx.get(r))),
        Promise.all(oldBucketRefs.map((r) => tx.get(r))),
      ]);
      for (const s of reads) {
        if (!s.exists) continue;
        if (s.get("holdId")) {
          throw new Error("slot_blocked");
        }
        const occ = s.get("bookingId") as string | undefined;
        if (occ && occ !== bookingId) {
          throw new Error("slot_taken");
        }
      }

      // Only release buckets this booking actually owns — a booking created
      // with "allow double-booking" may list ids that belong to another visit.
      for (const s of oldReads) {
        if (!s.exists) continue;
        if (s.get("bookingId") !== bookingId) continue;
        tx.delete(s.ref);
      }

      const startAt = Timestamp.fromDate(newStart.toUTC().toJSDate());
      const iso = newStartIso;

      for (const ref of bucketRefs) {
        tx.set(ref, {
          bookingId,
          locationId: locId,
          providerId: targetProviderId,
          serviceLine: targetServiceLine,
          durationMin: targetDurationMin,
          startIso: iso,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // Write only what actually moved, so a plain time change (the patient
      // portal path) touches exactly the same three fields it always has.
      tx.update(bookingRef, {
        startIso: iso,
        startAt,
        bucketIds: nb,
        ...(providerChanged
          ? { providerId: targetProviderId, providerDisplayName: provider.displayName }
          : {}),
        ...(targetServiceLine !== curServiceLine ? { serviceLine: targetServiceLine } : {}),
        ...(durationChanged ? { durationMin: targetDurationMin } : {}),
        ...(serviceChangedId
          ? {
              schedulerServiceId: targetSchedulerServiceId ?? FieldValue.delete(),
              serviceTypeName: targetServiceName ?? FieldValue.delete(),
              bufferBeforeMinutes: targetBufferBefore,
              bufferAfterMinutes: targetBufferAfter,
            }
          : {}),
      });

      recordBookingEventInTx(db, tx, bookingId, {
        type: "rescheduled",
        byUid: actor.uid,
        byEmail: actor.email,
        meta: {
          prevStartIso: snap.get("startIso"),
          newStartIso: iso,
          ...(providerChanged
            ? {
                prevProviderName: snap.get("providerDisplayName") ?? null,
                newProviderName: provider.displayName,
              }
            : {}),
          ...(targetServiceLine !== curServiceLine
            ? { prevServiceLine: curServiceLine, newServiceLine: targetServiceLine }
            : {}),
          ...(durationChanged
            ? { prevDurationMin: curDurationMin, newDurationMin: targetDurationMin }
            : {}),
          ...(serviceChangedId && targetServiceName
            ? { newServiceTypeName: targetServiceName }
            : {}),
        },
      });
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "slot_taken") {
        return { ok: false, code: "slot_taken", status: 409 };
      }
      if (e.message === "slot_blocked") {
        return { ok: false, code: "slot_blocked", status: 409 };
      }
      if (e.message === "not_found_tx") {
        return { ok: false, code: "not_found", status: 404 };
      }
      if (e.message === "bad_status" || e.message === "no_provider") {
        return { ok: false, code: "bad_status", status: 409 };
      }
      if (e.message === "invalid_time") {
        return { ok: false, code: "invalid_time", status: 400 };
      }
    }
    console.error("[updateBookingSchedule]", e);
    return { ok: false, code: "server_error", status: 500 };
  }

  return {
    ok: true,
    prevStartIso,
    newStartIso,
    changed: timeChanged,
    providerChanged,
    serviceChanged,
    anyChange: true,
  };
}
