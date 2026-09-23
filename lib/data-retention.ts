import { Timestamp, type Firestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import { TIME_ZONE } from "@/lib/constants";
import { PATIENTS_COLLECTION } from "@/lib/patients-db";
import { NOTIFICATIONS_LOG_COLLECTION } from "@/lib/notifications-log";

const FIRESTORE_BATCH_LIMIT = 400;

export type DataRetentionConfig = {
  enabled: boolean;
  retentionYears: number;
  maxBookings: number;
  maxSms: number;
  maxNotifications: number;
  maxPatients: number;
};

export type DataRetentionResult = {
  disabled?: boolean;
  dryRun: boolean;
  cutoffIso: string;
  deletedBookings: number;
  deletedEvents: number;
  deletedSms: number;
  /** notifications_log entries (reminder SMS/email bodies, phone, email, patientId). */
  deletedNotifications: number;
  deletedPatients: number;
  skippedUndatedBookings: number;
  truncated: boolean;
};

export function getDataRetentionConfig(): DataRetentionConfig {
  const yearsRaw = process.env.DATA_RETENTION_YEARS?.trim();
  const years = yearsRaw ? Number.parseInt(yearsRaw, 10) : 7;
  const maxBookingsRaw = process.env.DATA_RETENTION_MAX_BOOKINGS?.trim();
  const maxSmsRaw = process.env.DATA_RETENTION_MAX_SMS?.trim();
  const maxNotificationsRaw = process.env.DATA_RETENTION_MAX_NOTIFICATIONS?.trim();
  const maxPatientsRaw = process.env.DATA_RETENTION_MAX_PATIENTS?.trim();

  return {
    enabled: process.env.DATA_RETENTION_ENABLED?.trim() === "true",
    retentionYears: Number.isFinite(years) && years > 0 ? years : 7,
    maxBookings:
      Number.isFinite(Number(maxBookingsRaw)) && Number(maxBookingsRaw) > 0
        ? Number(maxBookingsRaw)
        : 500,
    maxSms:
      Number.isFinite(Number(maxSmsRaw)) && Number(maxSmsRaw) > 0 ? Number(maxSmsRaw) : 1000,
    maxNotifications:
      Number.isFinite(Number(maxNotificationsRaw)) && Number(maxNotificationsRaw) > 0
        ? Number(maxNotificationsRaw)
        : 1000,
    maxPatients:
      Number.isFinite(Number(maxPatientsRaw)) && Number(maxPatientsRaw) > 0
        ? Number(maxPatientsRaw)
        : 200,
  };
}

export function retentionCutoffTimestamp(years: number): Timestamp {
  const cutoff = DateTime.now().setZone(TIME_ZONE).minus({ years });
  return Timestamp.fromMillis(cutoff.toMillis());
}

/** Appointment date used for retention; falls back to createdAt when startAt is missing. */
export function bookingRetentionTimestamp(
  data: FirebaseFirestore.DocumentData,
): Timestamp | null {
  if (data.startAt instanceof Timestamp) return data.startAt;
  if (data.createdAt instanceof Timestamp) return data.createdAt;
  return null;
}

async function deleteBookingEvents(
  db: Firestore,
  bookingId: string,
  dryRun: boolean,
): Promise<number> {
  const eventsSnap = await db
    .collection("bookings")
    .doc(bookingId)
    .collection("events")
    .get();
  if (eventsSnap.empty) return 0;
  if (dryRun) return eventsSnap.size;

  let deleted = 0;
  const docs = eventsSnap.docs;
  for (let i = 0; i < docs.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = docs.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = db.batch();
    for (const doc of chunk) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deleted += chunk.length;
  }
  return deleted;
}

async function purgeOldBookings(
  db: Firestore,
  cutoff: Timestamp,
  maxBookings: number,
  dryRun: boolean,
): Promise<{
  deletedBookings: number;
  deletedEvents: number;
  skippedUndatedBookings: number;
  truncated: boolean;
  /** Purged (or, in dry run, would-be-purged) booking IDs per linked patient. */
  purgedBookingIdsByPatient: Map<string, Set<string>>;
}> {
  const byStartAt = await db
    .collection("bookings")
    .where("startAt", "<", cutoff)
    .limit(maxBookings + 1)
    .get();

  // Imported/legacy bookings may lack `startAt`; the `startAt <` query never
  // returns those, so also look them up by `createdAt` (the retention fallback
  // in bookingRetentionTimestamp) and let the per-doc check below decide.
  const seen = new Set<string>(byStartAt.docs.map((d) => d.id));
  const candidates: QueryDocumentSnapshot[] = [...byStartAt.docs];
  let fallbackTruncated = false;
  if (candidates.length <= maxBookings) {
    const byCreatedAt = await db
      .collection("bookings")
      .where("createdAt", "<", cutoff)
      .limit(maxBookings + 1)
      .get();
    for (const doc of byCreatedAt.docs) {
      if (seen.has(doc.id)) continue;
      if (doc.data().startAt instanceof Timestamp) continue; // covered by the startAt query
      seen.add(doc.id);
      candidates.push(doc);
    }
    fallbackTruncated = byCreatedAt.size > maxBookings;
  }

  const truncated = candidates.length > maxBookings || fallbackTruncated;
  const docs = candidates.slice(0, maxBookings);

  let deletedBookings = 0;
  let deletedEvents = 0;
  let skippedUndatedBookings = 0;
  const purgedBookingIdsByPatient = new Map<string, Set<string>>();

  for (const doc of docs) {
    const retentionTs = bookingRetentionTimestamp(doc.data());
    if (!retentionTs) {
      skippedUndatedBookings++;
      continue;
    }
    if (retentionTs.toMillis() >= cutoff.toMillis()) {
      continue;
    }

    const patientId = doc.get("patientId");
    if (typeof patientId === "string" && patientId.trim()) {
      const key = patientId.trim();
      const ids = purgedBookingIdsByPatient.get(key) ?? new Set<string>();
      ids.add(doc.id);
      purgedBookingIdsByPatient.set(key, ids);
    }

    deletedEvents += await deleteBookingEvents(db, doc.id, dryRun);
    if (!dryRun) {
      await doc.ref.delete();
    }
    deletedBookings++;
  }

  return {
    deletedBookings,
    deletedEvents,
    skippedUndatedBookings,
    truncated,
    purgedBookingIdsByPatient,
  };
}

/** Deletes up to `max` entries of a log collection whose `sentAt` is before the cutoff. */
async function purgeOldLogEntries(
  db: Firestore,
  collectionName: string,
  cutoff: Timestamp,
  max: number,
  dryRun: boolean,
): Promise<{ deleted: number; truncated: boolean }> {
  const snap = await db
    .collection(collectionName)
    .where("sentAt", "<", cutoff)
    .limit(max + 1)
    .get();

  const truncated = snap.size > max;
  const docs = snap.docs.slice(0, max);

  if (!dryRun && docs.length > 0) {
    for (let i = 0; i < docs.length; i += FIRESTORE_BATCH_LIMIT) {
      const batch = db.batch();
      for (const doc of docs.slice(i, i + FIRESTORE_BATCH_LIMIT)) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }
  }

  return { deleted: docs.length, truncated };
}

/**
 * True when the patient still has a booking that this run does not purge. In a
 * dry run the purged bookings still exist, so they are ignored explicitly.
 */
async function patientHasBookings(
  db: Firestore,
  patientId: string,
  purgedBookingIds: ReadonlySet<string> | undefined,
): Promise<boolean> {
  const ignore = purgedBookingIds ?? new Set<string>();
  const snap = await db
    .collection("bookings")
    .where("patientId", "==", patientId)
    .limit(ignore.size + 1)
    .get();
  return snap.docs.some((d) => !ignore.has(d.id));
}

function patientEligibleForDeletion(
  data: FirebaseFirestore.DocumentData,
  cutoff: Timestamp,
): boolean {
  if (data.deleted === true) return false;

  const lastVisit = data.lastVisitDate;
  if (lastVisit instanceof Timestamp) {
    return lastVisit.toMillis() < cutoff.toMillis();
  }

  const created = data.createdAt;
  if (created instanceof Timestamp) {
    return created.toMillis() < cutoff.toMillis();
  }

  return false;
}

async function purgeInactivePatients(
  db: Firestore,
  cutoff: Timestamp,
  maxPatients: number,
  dryRun: boolean,
  purgedBookingIdsByPatient: Map<string, Set<string>>,
): Promise<{ deletedPatients: number; truncated: boolean }> {
  const candidates = new Map<string, QueryDocumentSnapshot>();
  const patientIdsFromBookings = new Set(purgedBookingIdsByPatient.keys());

  for (const id of patientIdsFromBookings) {
    if (candidates.size >= maxPatients) break;
    const ref = db.collection(PATIENTS_COLLECTION).doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      candidates.set(id, snap as QueryDocumentSnapshot);
    }
  }

  if (candidates.size < maxPatients) {
    const byLastVisit = await db
      .collection(PATIENTS_COLLECTION)
      .where("lastVisitDate", "<", cutoff)
      .limit(maxPatients - candidates.size + 1)
      .get();
    for (const doc of byLastVisit.docs) {
      if (candidates.size >= maxPatients) break;
      candidates.set(doc.id, doc);
    }
  }

  if (candidates.size < maxPatients) {
    const byCreated = await db
      .collection(PATIENTS_COLLECTION)
      .where("createdAt", "<", cutoff)
      .limit(maxPatients - candidates.size + 1)
      .get();
    for (const doc of byCreated.docs) {
      if (candidates.size >= maxPatients) break;
      if (!(doc.data().lastVisitDate instanceof Timestamp)) {
        candidates.set(doc.id, doc);
      }
    }
  }

  const docList = [...candidates.values()].slice(0, maxPatients);
  let deletedPatients = 0;

  for (const doc of docList) {
    const data = doc.data();
    if (!patientEligibleForDeletion(data, cutoff)) continue;
    if (await patientHasBookings(db, doc.id, purgedBookingIdsByPatient.get(doc.id))) continue;
    if (!dryRun) {
      await doc.ref.delete();
    }
    deletedPatients++;
  }

  const truncated =
    patientIdsFromBookings.size + candidates.size > maxPatients ||
    candidates.size >= maxPatients;

  return { deletedPatients, truncated };
}

/**
 * Permanently removes scheduling data (bookings, SMS and notification logs,
 * inactive patients) older than the configured retention period.
 * No-ops unless DATA_RETENTION_ENABLED=true (except dry-run CLI which bypasses enabled).
 */
export async function runDataRetentionPurge(opts: {
  dryRun: boolean;
  /** When true, runs even if DATA_RETENTION_ENABLED is not set (for CLI preview). */
  force?: boolean;
  db?: Firestore;
}): Promise<DataRetentionResult> {
  const config = getDataRetentionConfig();
  if (!config.enabled && !opts.force && !opts.dryRun) {
    return {
      disabled: true,
      dryRun: false,
      cutoffIso: "",
      deletedBookings: 0,
      deletedEvents: 0,
      deletedSms: 0,
      deletedNotifications: 0,
      deletedPatients: 0,
      skippedUndatedBookings: 0,
      truncated: false,
    };
  }

  const db = opts.db ?? getFirestore();
  const cutoff = retentionCutoffTimestamp(config.retentionYears);
  const dryRun = opts.dryRun;

  const bookingResult = await purgeOldBookings(
    db,
    cutoff,
    config.maxBookings,
    dryRun,
  );
  const smsResult = await purgeOldLogEntries(db, "sms_send_log", cutoff, config.maxSms, dryRun);
  const notificationsResult = await purgeOldLogEntries(
    db,
    NOTIFICATIONS_LOG_COLLECTION,
    cutoff,
    config.maxNotifications,
    dryRun,
  );
  const patientResult = await purgeInactivePatients(
    db,
    cutoff,
    config.maxPatients,
    dryRun,
    bookingResult.purgedBookingIdsByPatient,
  );

  return {
    dryRun,
    cutoffIso: cutoff.toDate().toISOString(),
    deletedBookings: bookingResult.deletedBookings,
    deletedEvents: bookingResult.deletedEvents,
    deletedSms: smsResult.deleted,
    deletedNotifications: notificationsResult.deleted,
    deletedPatients: patientResult.deletedPatients,
    skippedUndatedBookings: bookingResult.skippedUndatedBookings,
    truncated:
      bookingResult.truncated ||
      smsResult.truncated ||
      notificationsResult.truncated ||
      patientResult.truncated,
  };
}
