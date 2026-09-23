import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getFirestore } from "./firebase-admin";

/** Purged by lib/data-retention.ts after the retention period (keyed on `sentAt`). */
export const NOTIFICATIONS_LOG_COLLECTION = "notifications_log";

export async function logNotificationSent(
  opts: {
    type: "sms" | "email";
    phone?: string | null;
    email?: string | null;
    message: string;
    subject?: string | null;
    patientId?: string | null;
    appointmentId?: string | null;
    bookingId?: string | null;
  },
  db: Firestore = getFirestore(),
): Promise<void> {
  await db.collection(NOTIFICATIONS_LOG_COLLECTION).add({
    type: opts.type,
    phone: opts.phone ?? null,
    email: opts.email ?? null,
    message: opts.message,
    subject: opts.subject ?? null,
    patientId: opts.patientId ?? null,
    appointmentId: opts.appointmentId ?? opts.bookingId ?? null,
    bookingId: opts.bookingId ?? null,
    sentAt: FieldValue.serverTimestamp(),
  });
}
