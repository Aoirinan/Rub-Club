import {
  FieldValue,
  Timestamp,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import type { BookingStatus } from "./booking-status";

export type BookingEventType =
  | "created"
  | "accepted"
  | "declined"
  | "cancelled"
  | "note"
  | "reminder_sent"
  | "payment_requested"
  | "payment_completed"
  | "custom_email"
  | "rescheduled"
  | "survey_sent";

export type BookingEventRecord = {
  type: BookingEventType;
  byUid: string | null;
  byEmail: string | null;
  reason?: string;
  meta?: Record<string, unknown>;
};

/**
 * Append an audit event for a booking inside an existing transaction.
 * The `at` field uses serverTimestamp() so it's set authoritatively by Firestore.
 */
export function recordBookingEventInTx(
  db: Firestore,
  tx: Transaction,
  bookingId: string,
  evt: BookingEventRecord,
): void {
  const ref = db.collection("bookings").doc(bookingId).collection("events").doc();
  tx.set(ref, {
    type: evt.type,
    at: FieldValue.serverTimestamp(),
    byUid: evt.byUid,
    byEmail: evt.byEmail,
    ...(evt.reason ? { reason: evt.reason } : {}),
    ...(evt.meta ? { meta: evt.meta } : {}),
  });
}

/** Append an audit event outside a transaction (for fire-and-forget notes). */
export async function recordBookingEvent(
  db: Firestore,
  bookingId: string,
  evt: BookingEventRecord,
): Promise<void> {
  const ref = db.collection("bookings").doc(bookingId).collection("events").doc();
  await ref.set({
    type: evt.type,
    at: FieldValue.serverTimestamp(),
    byUid: evt.byUid,
    byEmail: evt.byEmail,
    ...(evt.reason ? { reason: evt.reason } : {}),
    ...(evt.meta ? { meta: evt.meta } : {}),
  });
}

export type BookingEventDto = {
  id: string;
  type: BookingEventType;
  atIso: string | null;
  byUid: string | null;
  byEmail: string | null;
  reason?: string;
  meta?: Record<string, unknown>;
  prevStatus?: BookingStatus;
};

export async function listBookingEvents(
  db: Firestore,
  bookingId: string,
): Promise<BookingEventDto[]> {
  const snap = await db
    .collection("bookings")
    .doc(bookingId)
    .collection("events")
    .orderBy("at", "asc")
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    const at = data.at as Timestamp | undefined;
    const meta = (data.meta ?? undefined) as Record<string, unknown> | undefined;
    const prev = meta && typeof meta.prevStatus === "string" ? (meta.prevStatus as BookingStatus) : undefined;
    return {
      id: d.id,
      type: data.type as BookingEventType,
      atIso: at ? at.toDate().toISOString() : null,
      byUid: (data.byUid ?? null) as string | null,
      byEmail: (data.byEmail ?? null) as string | null,
      ...(data.reason ? { reason: String(data.reason) } : {}),
      ...(meta ? { meta } : {}),
      ...(prev ? { prevStatus: prev } : {}),
    };
  });
}
