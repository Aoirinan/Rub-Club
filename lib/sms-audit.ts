import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";

function normalizeDigits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d.slice(0, 10);
}

export async function logSmsSent(
  opts: {
    phone: string;
    message: string;
    appointmentId?: string | null;
    bookingId?: string | null;
    patientId?: string | null;
  },
  db: Firestore = getFirestore(),
): Promise<void> {
  const digits = normalizeDigits(opts.phone);
  await db.collection("sms_send_log").add({
    phoneDigits: digits,
    phone: opts.phone,
    message: opts.message,
    appointmentId: opts.appointmentId ?? null,
    bookingId: opts.bookingId ?? null,
    patientId: opts.patientId ?? null,
    sentAt: FieldValue.serverTimestamp(),
  });
}
