import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import type { LocationId, ServiceLine } from "./constants";
import { TIME_ZONE } from "./constants";
import { appointmentHasStarted } from "./appointment-started";
import { recordBookingEventInTx } from "./booking-events";
import { isValidCatalogDurationMin } from "./booking-duration";
import type { BookingStatus } from "./booking-status";
import { providerAllowsAppointmentTime } from "./provider-scheduling";
import type { ProviderRow } from "./provider-types";
import { fetchActiveProvidersForService } from "./providers-db";
import { schedulerServiceMatchesLine } from "./scheduler-service-lines";
import { fetchSchedulerServiceById } from "./scheduler-services-db";
import {
  bucketDocIdsForAppointment,
  holdBucketIdsForPublicBooking,
  isAlignedToSlotGrid,
  otherOfficeBucketIdsForAppointment,
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
  | "inactive_service"
  | "service_line_mismatch"
  | "stale"
  | "already_started"
  | "started_requires_manager"
  | "server_error";

/** A moved start must be at least this far in the future… */
export const RESCHEDULE_MIN_LEAD_MINUTES = 2;
/** …and no further out than this. Open-time lists apply the same bounds. */
export const RESCHEDULE_HORIZON_DAYS = 90;

/**
 * Lengths staff may give a booking: the same range admin create accepts from
 * the catalog (15–480 minutes, any whole minute). Slot buckets round a partial
 * 30-minute slot up, so an off-grid length still blocks every slot it touches.
 * Start times stay on the 30-minute grid.
 */
export function isValidAdminBookingDurationMin(n: number): boolean {
  return isValidCatalogDurationMin(n);
}

/**
 * True once a visit is under way: its current start time has arrived, or the
 * front desk has checked the patient in (even if early).
 */
export function visitHasStarted(d: Record<string, unknown>, now?: DateTime): boolean {
  return appointmentHasStarted(d.startIso, now) || (d.checkedInAt !== undefined && d.checkedInAt !== null);
}

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

/**
 * What the editor saw when it opened. When given, the save is refused with
 * `stale` if the stored booking no longer matches, so one person's edit can't
 * silently undo another's. Fields left out are not compared.
 */
export type ExpectedBookingSchedule = {
  startIso?: string;
  providerId?: string;
  durationMin?: number;
  serviceLine?: ServiceLine;
  /** "" means "no catalog service". */
  schedulerServiceId?: string;
};

export type UpdateBookingScheduleOptions = {
  allowPending: boolean;
  expected?: ExpectedBookingSchedule;
  /** Patient portal: refuse once the current appointment time has arrived. */
  refuseIfStarted?: boolean;
  /**
   * Staff below manager: refuse to change the START TIME of a visit that has
   * started or been checked in (`started_requires_manager`). Provider, service
   * and length corrections without a time change are still allowed.
   */
  startedTimeChangeRequiresManager?: boolean;
};

function trimmedString(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function sameInstant(a: string, b: string): boolean {
  if (a === b) return true;
  const da = DateTime.fromISO(a, { setZone: true });
  const db = DateTime.fromISO(b, { setZone: true });
  return da.isValid && db.isValid && da.toMillis() === db.toMillis();
}

export function bookingMatchesExpected(
  d: Record<string, unknown>,
  expected: ExpectedBookingSchedule,
): boolean {
  if (expected.startIso !== undefined && !sameInstant(trimmedString(d.startIso), expected.startIso.trim())) {
    return false;
  }
  if (expected.providerId !== undefined && trimmedString(d.providerId) !== expected.providerId.trim()) {
    return false;
  }
  if (expected.durationMin !== undefined && d.durationMin !== expected.durationMin) return false;
  if (expected.serviceLine !== undefined && d.serviceLine !== expected.serviceLine) return false;
  if (
    expected.schedulerServiceId !== undefined &&
    trimmedString(d.schedulerServiceId) !== expected.schedulerServiceId.trim()
  ) {
    return false;
  }
  return true;
}

/**
 * Every stored field the edit was planned from. The transaction compares the
 * fresh snapshot against the pre-read one: if anything moved in between, the
 * precomputed buckets/provider would be wrong, so the save is refused rather
 * than retried (a Firestore retry re-runs the same stale closure).
 */
function scheduleFingerprint(d: Record<string, unknown> | undefined): string {
  const x = d ?? {};
  return JSON.stringify([
    x.locationId ?? null,
    trimmedString(x.providerId),
    x.serviceLine ?? null,
    x.durationMin ?? null,
    trimmedString(x.schedulerServiceId),
    numberOr(x.bufferBeforeMinutes, 0),
    numberOr(x.bufferAfterMinutes, 0),
    typeof x.startIso === "string" ? x.startIso : "",
  ]);
}

export type TargetServiceResolution =
  | {
      ok: true;
      schedulerServiceId: string | undefined;
      /** True when the catalog service id itself changes (including cleared). */
      serviceChangedId: boolean;
      serviceTypeName: string | undefined;
      bufferBeforeMinutes: number;
      bufferAfterMinutes: number;
      /** Catalog length of a newly chosen service. */
      defaultDurationMin?: number;
    }
  | { ok: false; code: "unknown_service" | "inactive_service" | "service_line_mismatch" };

/**
 * Work out which catalog service (and so which buffers) a booking ends up with.
 * `requestedServiceId` undefined keeps the current one; "" clears it. A newly
 * chosen service must be active (as admin create requires), and the resulting
 * service must belong to the target service line.
 */
export async function resolveTargetService(
  db: Firestore,
  booking: Record<string, unknown>,
  requestedServiceId: string | undefined,
  targetServiceLine: ServiceLine,
): Promise<TargetServiceResolution> {
  const curId = trimmedString(booking.schedulerServiceId) || undefined;
  const targetId = (requestedServiceId ?? curId)?.trim() || undefined;
  const serviceChangedId = targetId !== curId;
  const lineChanged = targetServiceLine !== booking.serviceLine;

  let serviceTypeName = typeof booking.serviceTypeName === "string" ? booking.serviceTypeName : undefined;
  let bufferBeforeMinutes = numberOr(booking.bufferBeforeMinutes, 0);
  let bufferAfterMinutes = numberOr(booking.bufferAfterMinutes, 0);
  let defaultDurationMin: number | undefined;

  if (targetId) {
    if (serviceChangedId || lineChanged) {
      const svc = await fetchSchedulerServiceById(db, targetId);
      if (!svc) return { ok: false, code: "unknown_service" };
      if (serviceChangedId && !svc.active) return { ok: false, code: "inactive_service" };
      if (!schedulerServiceMatchesLine(svc, targetServiceLine)) {
        return { ok: false, code: "service_line_mismatch" };
      }
      if (serviceChangedId) {
        serviceTypeName = svc.name;
        bufferBeforeMinutes = svc.bufferBeforeMinutes ?? 0;
        bufferAfterMinutes = svc.bufferAfterMinutes ?? 0;
        defaultDurationMin = svc.durationMinutes;
      }
    }
  } else if (serviceChangedId) {
    // Cleared the catalog service: drop its name and buffers.
    serviceTypeName = undefined;
    bufferBeforeMinutes = 0;
    bufferAfterMinutes = 0;
  }

  return {
    ok: true,
    schedulerServiceId: targetId,
    serviceChangedId,
    serviceTypeName,
    bufferBeforeMinutes,
    bufferAfterMinutes,
    defaultDurationMin,
  };
}

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
  options: UpdateBookingScheduleOptions,
): Promise<RescheduleResult> {
  return updateBookingSchedule(db, bookingId, { startIso }, actor, options);
}

/**
 * Change a booking's time and/or provider, service line, duration and catalog
 * service in one transaction. Slot buckets are re-checked against the NEW
 * provider/duration/buffers, and only buckets this booking actually owns are
 * released (a booking created with "allow double-booking" lists none). An edit
 * that only relabels the catalog service (same time, provider, line, length and
 * buffers) leaves the slot buckets alone.
 */
export async function updateBookingSchedule(
  db: Firestore,
  bookingId: string,
  changes: BookingScheduleChanges,
  actor: { uid: string | null; email: string | null },
  options: UpdateBookingScheduleOptions,
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
  if (options.expected && !bookingMatchesExpected(d, options.expected)) {
    return { ok: false, code: "stale", status: 409 };
  }
  if (options.refuseIfStarted && appointmentHasStarted(d.startIso)) {
    return { ok: false, code: "already_started", status: 409 };
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
  const svc = await resolveTargetService(db, d, changes.schedulerServiceId, targetServiceLine);
  if (!svc.ok) {
    return { ok: false, code: svc.code, status: 400 };
  }
  const {
    schedulerServiceId: targetSchedulerServiceId,
    serviceChangedId,
    serviceTypeName: targetServiceName,
    bufferBeforeMinutes: targetBufferBefore,
    bufferAfterMinutes: targetBufferAfter,
  } = svc;
  const curServiceName = typeof d.serviceTypeName === "string" ? d.serviceTypeName : undefined;

  const targetDurationMin =
    changes.durationMin ?? svc.defaultDurationMin ?? (curDurationMin as number);
  const durationChanged = targetDurationMin !== curDurationMin;
  // Only hold a changed duration to the allowed range — existing bookings may
  // legitimately carry a length from an older catalog entry.
  if (durationChanged && !isValidAdminBookingDurationMin(targetDurationMin)) {
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
  const serviceLineChanged = targetServiceLine !== curServiceLine;
  const serviceChanged = serviceLineChanged || durationChanged || serviceChangedId;
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

  if (options.startedTimeChangeRequiresManager && timeChanged && visitHasStarted(d)) {
    return { ok: false, code: "started_requires_manager", status: 403 };
  }

  // Nothing that decides which slot buckets the visit holds is moving (only the
  // catalog label is), so don't re-check or rewrite them. A visit booked with
  // "allow double-booking", or later overlapped by a hold, can still be relabelled.
  const bucketsUnchanged =
    !timeChanged &&
    !providerChanged &&
    !serviceLineChanged &&
    !durationChanged &&
    targetBufferBefore === numberOr(d.bufferBeforeMinutes, 0) &&
    targetBufferAfter === numberOr(d.bufferAfterMinutes, 0);

  // Past / horizon bounds apply only when the appointment actually moves, so a
  // provider swap on a booking happening in ten minutes still works.
  if (timeChanged) {
    const now = DateTime.now().setZone(TIME_ZONE);
    if (newStart < now.plus({ minutes: RESCHEDULE_MIN_LEAD_MINUTES })) {
      return { ok: false, code: "invalid_time", status: 400 };
    }
    if (newStart > now.plus({ days: RESCHEDULE_HORIZON_DAYS })) {
      return { ok: false, code: "invalid_time", status: 400 };
    }
  }

  let provider: ProviderRow | undefined;
  if (!bucketsUnchanged) {
    const eligible = await fetchActiveProvidersForService(db, locationId, targetServiceLine);
    provider = eligible.find((p) => p.id === targetProviderId);
    if (!provider) {
      return { ok: false, code: "no_provider", status: 400 };
    }
    if (!providerAllowsAppointmentTime(provider, newStart, targetDurationMin)) {
      return { ok: false, code: "outside_hours", status: 400 };
    }
  }

  const planned = scheduleFingerprint(d);
  const serviceFields = serviceChangedId
    ? {
        schedulerServiceId: targetSchedulerServiceId ?? FieldValue.delete(),
        serviceTypeName: targetServiceName ?? FieldValue.delete(),
        bufferBeforeMinutes: targetBufferBefore,
        bufferAfterMinutes: targetBufferAfter,
      }
    : {};
  const serviceMeta = serviceChangedId
    ? { prevServiceTypeName: curServiceName ?? null, newServiceTypeName: targetServiceName ?? null }
    : {};

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
      // Someone else changed the booking after it was read above.
      if (scheduleFingerprint(snap.data()) !== planned) {
        throw new Error("stale");
      }
      if (options.refuseIfStarted && appointmentHasStarted(snap.get("startIso"))) {
        throw new Error("already_started");
      }
      // Checked in (or reached its start) since the pre-read.
      if (options.startedTimeChangeRequiresManager && timeChanged && visitHasStarted(snap.data() ?? {})) {
        throw new Error("started_requires_manager");
      }

      if (bucketsUnchanged) {
        tx.update(bookingRef, serviceFields);
        recordBookingEventInTx(db, tx, bookingId, {
          type: "rescheduled",
          byUid: actor.uid,
          byEmail: actor.email,
          meta: { prevStartIso, newStartIso: prevStartIso, ...serviceMeta },
        });
        return;
      }

      const locId = locationId;
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
      // A provider listed at both offices can't be in both at once: the same
      // time at their other office counts too (read only, never written).
      const otherOfficeIds = otherOfficeBucketIdsForAppointment(
        locId,
        provider!,
        newStart,
        targetDurationMin,
        { bufferBeforeMinutes: targetBufferBefore, bufferAfterMinutes: targetBufferAfter },
      );
      const bucketRefs = nb.map((id) => db.collection("slot_buckets").doc(id));
      const holdRefs = hids.map((id) => db.collection("slot_buckets").doc(id));
      const otherOfficeRefs = otherOfficeIds.map((id) => db.collection("slot_buckets").doc(id));
      const combined = [...bucketRefs, ...holdRefs, ...otherOfficeRefs];
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
          ? { providerId: targetProviderId, providerDisplayName: provider!.displayName }
          : {}),
        ...(serviceLineChanged ? { serviceLine: targetServiceLine } : {}),
        ...(durationChanged ? { durationMin: targetDurationMin } : {}),
        ...serviceFields,
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
                newProviderName: provider!.displayName,
              }
            : {}),
          ...(serviceLineChanged
            ? { prevServiceLine: curServiceLine, newServiceLine: targetServiceLine }
            : {}),
          ...(durationChanged
            ? { prevDurationMin: curDurationMin, newDurationMin: targetDurationMin }
            : {}),
          ...serviceMeta,
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
      if (e.message === "stale") {
        return { ok: false, code: "stale", status: 409 };
      }
      if (e.message === "already_started") {
        return { ok: false, code: "already_started", status: 409 };
      }
      if (e.message === "started_requires_manager") {
        return { ok: false, code: "started_requires_manager", status: 403 };
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
