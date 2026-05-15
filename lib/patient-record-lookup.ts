import type { Firestore } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { signedIntakeDocumentUrl } from "@/lib/intake-documents";
import { nameSearchVariants } from "@/lib/patient-search-parse";

export { parsePatientLookupSearchParams, type PatientLookupParse } from "@/lib/patient-search-parse";

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

function sentAtSeconds(row: Record<string, unknown>): number {
  const s = row.sentAt as { seconds?: number; _seconds?: number } | undefined;
  if (s && typeof s === "object") {
    if (typeof s.seconds === "number") return s.seconds;
    if (typeof s._seconds === "number") return s._seconds;
  }
  return 0;
}

async function mergeSmsLogsForPhoneDigits(
  digitKeys: string[],
  db: Firestore,
): Promise<Record<string, unknown>[]> {
  const keys = [...new Set(digitKeys.map((k) => normalizeSmsDigits(k.replace(/\D/g, ""))))]
    .filter((k) => k.length >= 10)
    .slice(0, 24);
  if (keys.length === 0) return [];

  const rowsLists = await Promise.all(
    keys.map(async (phoneDigits) => {
      try {
        const smsSnap = await db
          .collection("sms_send_log")
          .where("phoneDigits", "==", phoneDigits)
          .orderBy("sentAt", "desc")
          .limit(50)
          .get();
        return smsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {
        return [] as Record<string, unknown>[];
      }
    }),
  );
  const merged = rowsLists.flat();
  merged.sort((a, b) => sentAtSeconds(b) - sentAtSeconds(a));
  return merged.slice(0, 200);
}

async function mapIntakeDocsToRows(
  intakeMap: Map<string, Record<string, unknown>>,
): Promise<PatientIntakeRow[]> {
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
  return intakes;
}

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

  const intakes = await mapIntakeDocsToRows(intakeMap);

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

/**
 * Prefix match on `bookings.name` and `intake_forms.firstName` / `lastName`, then SMS logs for phones found.
 */
export async function fetchPatientRecordByNameQuery(name: string): Promise<{
  bookings: Record<string, unknown>[];
  intakes: PatientIntakeRow[];
  smsLog: Record<string, unknown>[];
}> {
  const db = getFirestore();
  const variants = nameSearchVariants(name);
  if (variants.length === 0) {
    return { bookings: [], intakes: [], smsLog: [] };
  }

  const bookingMap = new Map<string, Record<string, unknown>>();
  outer: for (const v of variants) {
    const end = `${v}\uf8ff`;
    const snap = await db.collection("bookings").where("name", ">=", v).where("name", "<=", end).limit(60).get();
    for (const doc of snap.docs) {
      bookingMap.set(doc.id, { id: doc.id, ...doc.data() });
      if (bookingMap.size >= 120) break outer;
    }
  }

  const intakeMap = new Map<string, Record<string, unknown>>();
  for (const v of variants) {
    const end = `${v}\uf8ff`;
    for (const field of ["firstName", "lastName"] as const) {
      const snap = await db
        .collection("intake_forms")
        .where(field, ">=", v)
        .where(field, "<=", end)
        .limit(35)
        .get();
      for (const doc of snap.docs) {
        intakeMap.set(doc.id, { id: doc.id, ...doc.data() });
      }
    }
  }

  const bookings = [...bookingMap.values()].sort((a, b) => {
    const ta = typeof a.startIso === "string" ? a.startIso : "";
    const tb = typeof b.startIso === "string" ? b.startIso : "";
    return ta.localeCompare(tb);
  });

  const intakes = await mapIntakeDocsToRows(intakeMap);

  const phoneDigits: string[] = [];
  for (const b of bookings) {
    const p = typeof b.phone === "string" ? b.phone : "";
    const d = normalizeSmsDigits(p);
    if (d.length === 10) phoneDigits.push(d);
  }
  for (const data of intakeMap.values()) {
    const p = typeof data.phone === "string" ? data.phone : "";
    const d = normalizeSmsDigits(p);
    if (d.length === 10) phoneDigits.push(d);
  }

  const smsLog = await mergeSmsLogsForPhoneDigits(phoneDigits, db);

  return { bookings, intakes, smsLog };
}
