import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Firestore, DocumentReference } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import type { DurationMin, LocationId, ServiceLine } from "@/lib/constants";
import {
  bucketDocIdsForAppointment,
  holdBucketIdsForAppointment,
} from "@/lib/slots-luxon";
import { recordBookingEventInTx } from "@/lib/booking-events";
import { generatePatientPortalToken, hashPatientPortalToken } from "@/lib/patient-portal-token";

export type StaffActorInsert = { uid: string; email: string | null };

export type InsertAdminBookingArgs = {
  start: DateTime;
  locationId: LocationId;
  serviceLine: ServiceLine;
  durationMin: DurationMin;
  providerId: string;
  providerDisplayName: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: "pending" | "confirmed";
  skipConflictCheck: boolean;
  staff: StaffActorInsert;
  /** Logged on booking `events` for auditing. */
  createMetaVia: "admin_manual" | "csv_import";
  seriesId?: string;
  recurrence?: { frequency: "weekly" | "biweekly"; count: number };
};

export type InsertAdminBookingResult = "ok" | "slot_taken" | "slot_blocked";

/**
 * Creates one admin booking + slot buckets inside a Firestore transaction.
 * Caller must allocate `bookingRef` with `db.collection("bookings").doc()` first.
 */
export async function insertAdminBookingInTransaction(
  db: Firestore,
  bookingRef: DocumentReference,
  args: InsertAdminBookingArgs,
): Promise<InsertAdminBookingResult> {
  const {
    start: thisStart,
    locationId,
    serviceLine,
    durationMin,
    providerId,
    providerDisplayName,
    name,
    phone,
    email,
    notes,
    status,
    skipConflictCheck,
    staff,
    createMetaVia,
    seriesId,
    recurrence,
  } = args;

  const portalHash =
    status === "confirmed" ? hashPatientPortalToken(generatePatientPortalToken()) : "";

  const bucketIds = bucketDocIdsForAppointment(locationId, providerId, thisStart, durationMin);

  try {
    await db.runTransaction(async (tx) => {
      if (!skipConflictCheck) {
        const providerBucketRefs = bucketIds.map((id) => db.collection("slot_buckets").doc(id));
        const holdIds = holdBucketIdsForAppointment(locationId, serviceLine, thisStart, durationMin);
        const holdRefs = holdIds.map((id) => db.collection("slot_buckets").doc(id));

        const providerSnaps = await Promise.all(providerBucketRefs.map((r) => tx.get(r)));
        for (const s of providerSnaps) {
          if (s.exists) throw new Error("slot_taken");
        }
        const holdSnaps = await Promise.all(holdRefs.map((r) => tx.get(r)));
        for (const s of holdSnaps) {
          if (s.exists) throw new Error("slot_blocked");
        }

        for (const ref of providerBucketRefs) {
          tx.set(ref, {
            bookingId: bookingRef.id,
            locationId,
            providerId,
            serviceLine,
            durationMin,
            startIso: thisStart.toUTC().toISO(),
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }

      const startAt = Timestamp.fromDate(thisStart.toUTC().toJSDate());

      tx.set(bookingRef, {
        locationId,
        serviceLine,
        durationMin,
        startIso: thisStart.toUTC().toISO(),
        startAt,
        bucketIds,
        providerMode: "specific",
        providerId,
        providerDisplayName,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        notes: notes.trim(),
        status,
        ...(seriesId ? { seriesId, recurrence } : {}),
        ...(status === "confirmed"
          ? {
              acceptedByUid: staff.uid,
              acceptedByEmail: staff.email ?? null,
              acceptedAt: FieldValue.serverTimestamp(),
              ...(portalHash ? { patientPortalTokenHash: portalHash } : {}),
            }
          : {}),
        createdAt: FieldValue.serverTimestamp(),
      });

      recordBookingEventInTx(db, tx, bookingRef.id, {
        type: "created",
        byUid: staff.uid,
        byEmail: staff.email ?? null,
        meta: {
          via: createMetaVia,
          ...(seriesId ? { seriesId, recurrence } : {}),
        },
      });

      if (status === "confirmed") {
        recordBookingEventInTx(db, tx, bookingRef.id, {
          type: "accepted",
          byUid: staff.uid,
          byEmail: staff.email ?? null,
          meta: { via: createMetaVia, autoConfirmed: true },
        });
      }
    });
    return "ok";
  } catch (e) {
    if (e instanceof Error && e.message === "slot_taken") return "slot_taken";
    if (e instanceof Error && e.message === "slot_blocked") return "slot_blocked";
    throw e;
  }
}
