import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import type { LocationId } from "./constants";
import { TIME_ZONE } from "./constants";
import { recordBookingEventInTx } from "./booking-events";
import type { BookingStatus } from "./booking-status";
import { fetchActiveProvidersForService } from "./providers-db";
import {
  bucketDocIdsForAppointment,
  holdBucketIdsForAppointment,
  isAlignedToSlotGrid,
  isWithinScheduleWindow,
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
  | "server_error";

export type RescheduleResult =
  | { ok: true }
  | { ok: false; code: RescheduleFailureCode; status: number };

function isBookingFieldOk(
  locationId: unknown,
  serviceLine: unknown,
  durationMin: unknown,
): locationId is LocationId {
  return (
    (locationId === "paris" || locationId === "sulphur_springs") &&
    (serviceLine === "massage" || serviceLine === "chiropractic") &&
    (durationMin === 30 || durationMin === 60)
  );
}

/**
 * Move a booking to a new start time (same provider). Deletes old `slot_buckets`
 * and writes new ones; records a `rescheduled` event.
 */
export async function rescheduleBookingForStartChange(
  db: Firestore,
  bookingId: string,
  startIso: string,
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

  const providerIdRaw = typeof d.providerId === "string" ? d.providerId.trim() : "";
  if (!providerIdRaw) {
    return { ok: false, code: "no_provider", status: 400 };
  }

  const locationId = d.locationId;
  const serviceLine = d.serviceLine;
  const durationMin = d.durationMin;
  if (!isBookingFieldOk(locationId, serviceLine, durationMin)) {
    return { ok: false, code: "bad_status", status: 409 };
  }

  const newStart = parseStartIsoToDateTime(startIso);
  if (!newStart || !isAlignedToSlotGrid(newStart)) {
    return { ok: false, code: "invalid_time", status: 400 };
  }

  const prevStartIso = typeof d.startIso === "string" ? d.startIso : "";
  if (prevStartIso && newStart.toUTC().toISO() === prevStartIso) {
    return { ok: true };
  }

  const now = DateTime.now().setZone(TIME_ZONE);
  if (newStart < now.plus({ minutes: 2 })) {
    return { ok: false, code: "invalid_time", status: 400 };
  }
  if (newStart > now.plus({ days: 90 })) {
    return { ok: false, code: "invalid_time", status: 400 };
  }

  const eligible = await fetchActiveProvidersForService(db, locationId, serviceLine);
  const provider = eligible.find((p) => p.id === providerIdRaw);
  if (!provider) {
    return { ok: false, code: "no_provider", status: 400 };
  }
  if (!isWithinScheduleWindow(newStart, durationMin, provider.schedule ?? null)) {
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

      const pid = (snap.get("providerId") as string)?.trim() ?? "";
      if (!pid) {
        throw new Error("no_provider");
      }

      const locId = snap.get("locationId");
      const svc = snap.get("serviceLine");
      const dur = snap.get("durationMin");
      if (!isBookingFieldOk(locId, svc, dur)) {
        throw new Error("bad_status");
      }

      const nStart = parseStartIsoToDateTime(startIso);
      if (!nStart || !isAlignedToSlotGrid(nStart)) {
        throw new Error("invalid_time");
      }

      const oldBucketIds = (snap.get("bucketIds") as string[]) ?? [];
      const nb = bucketDocIdsForAppointment(locId, pid, nStart, dur);
      const hids = holdBucketIdsForAppointment(locId, svc, nStart, dur);
      const bucketRefs = nb.map((id) => db.collection("slot_buckets").doc(id));
      const holdRefs = hids.map((id) => db.collection("slot_buckets").doc(id));
      const combined = [...bucketRefs, ...holdRefs];
      const reads = await Promise.all(combined.map((r) => tx.get(r)));
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

      for (const bid of oldBucketIds) {
        tx.delete(db.collection("slot_buckets").doc(bid));
      }

      const startAt = Timestamp.fromDate(nStart.toUTC().toJSDate());
      const iso = nStart.toUTC().toISO()!;

      for (const ref of bucketRefs) {
        tx.set(ref, {
          bookingId,
          locationId: locId,
          providerId: pid,
          serviceLine: svc,
          durationMin: dur,
          startIso: iso,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      tx.update(bookingRef, {
        startIso: iso,
        startAt,
        bucketIds: nb,
      });

      recordBookingEventInTx(db, tx, bookingId, {
        type: "rescheduled",
        byUid: actor.uid,
        byEmail: actor.email,
        meta: { prevStartIso: snap.get("startIso"), newStartIso: iso },
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
    console.error("[rescheduleBookingForStartChange]", e);
    return { ok: false, code: "server_error", status: 500 };
  }

  return { ok: true };
}
