import { getFirestore } from "@/lib/firebase-admin";
import { signedIntakeDocumentUrl } from "@/lib/intake-documents";

export function phoneVariantsForLookup(digits: string): string[] {
  const d = digits.replace(/\D/g, "");
  if (d.length === 10) {
    const dashed = `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return [dashed, d, `+1${d}`];
  }
  return [digits.trim()];
}

/** Match `sms_send_log.phoneDigits` (10-digit US). */
export function normalizeSmsDigits(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length >= 11 && d.startsWith("1")) return d.slice(-10);
  if (d.length >= 10) return d.slice(-10);
  return d;
}

export type PatientIntakeRow = {
  id: string;
  firstName: unknown;
  lastName: unknown;
  phone: unknown;
  email: unknown;
  insuranceFrontUrl: string | null;
  insuranceBackUrl: string | null;
};

/**
 * Loads bookings, intake rows (with signed insurance URLs), and SMS log for a phone query.
 * Used by superadmin and staff patient views.
 */
export async function fetchPatientRecordByPhoneDigits(digits: string): Promise<{
  bookings: Record<string, unknown>[];
  intakes: PatientIntakeRow[];
  smsLog: Record<string, unknown>[];
}> {
  const smsDigits = normalizeSmsDigits(digits);
  const db = getFirestore();

  const bookingMap = new Map<string, Record<string, unknown>>();
  for (const pv of phoneVariantsForLookup(digits)) {
    const snap = await db.collection("bookings").where("phone", "==", pv).limit(100).get();
    for (const d of snap.docs) {
      bookingMap.set(d.id, { id: d.id, ...d.data() });
    }
  }
  const bookings = [...bookingMap.values()].sort((a, b) => {
    const ta = typeof a.startIso === "string" ? a.startIso : "";
    const tb = typeof b.startIso === "string" ? b.startIso : "";
    return ta.localeCompare(tb);
  });

  const intakeMap = new Map<string, Record<string, unknown>>();
  for (const pv of phoneVariantsForLookup(digits)) {
    const intakeSnap = await db.collection("intake_forms").where("phone", "==", pv).limit(20).get();
    for (const doc of intakeSnap.docs) {
      intakeMap.set(doc.id, { id: doc.id, ...doc.data() });
    }
  }

  const intakes: PatientIntakeRow[] = [];
  for (const data of intakeMap.values()) {
    const insuranceFront = data.insuranceCardFront as
      | { storagePath?: string; originalFilename?: string; contentType?: string }
      | undefined;
    const insuranceBack = data.insuranceCardBack as
      | { storagePath?: string; originalFilename?: string; contentType?: string }
      | undefined;
    let frontUrl: string | null = null;
    let backUrl: string | null = null;
    try {
      if (insuranceFront?.storagePath && insuranceFront.contentType) {
        frontUrl = await signedIntakeDocumentUrl({
          storagePath: insuranceFront.storagePath,
          originalFilename: insuranceFront.originalFilename ?? "front.jpg",
          contentType: insuranceFront.contentType,
          mode: "inline",
          expiresMs: 15 * 60 * 1000,
        });
      }
      if (insuranceBack?.storagePath && insuranceBack.contentType) {
        backUrl = await signedIntakeDocumentUrl({
          storagePath: insuranceBack.storagePath,
          originalFilename: insuranceBack.originalFilename ?? "back.jpg",
          contentType: insuranceBack.contentType,
          mode: "inline",
          expiresMs: 15 * 60 * 1000,
        });
      }
    } catch {
      /* ignore */
    }
    intakes.push({
      id: String(data.id),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      insuranceFrontUrl: frontUrl,
      insuranceBackUrl: backUrl,
    });
  }

  let smsLog: Record<string, unknown>[] = [];
  try {
    const smsSnap = await db
      .collection("sms_send_log")
      .where("phoneDigits", "==", smsDigits)
      .orderBy("sentAt", "desc")
      .limit(80)
      .get();
    smsLog = smsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    smsLog = [];
  }

  return { bookings, intakes, smsLog };
}
