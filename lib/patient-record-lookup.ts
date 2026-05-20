import type { Firestore } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
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

/**
 * Loads bookings and SMS log for a phone query. Used by superadmin and staff
 * patient views. This website never stores clinical intake or insurance uploads,
 * so no PHI documents are returned here.
 */
export async function fetchPatientRecordByPhoneDigits(digits: string): Promise<{
  bookings: Record<string, unknown>[];
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

  return { bookings, smsLog };
}

/**
 * Prefix match on `bookings.name`, then SMS logs for phones found.
 */
export async function fetchPatientRecordByNameQuery(name: string): Promise<{
  bookings: Record<string, unknown>[];
  smsLog: Record<string, unknown>[];
}> {
  const db = getFirestore();
  const variants = nameSearchVariants(name);
  if (variants.length === 0) {
    return { bookings: [], smsLog: [] };
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

  const bookings = [...bookingMap.values()].sort((a, b) => {
    const ta = typeof a.startIso === "string" ? a.startIso : "";
    const tb = typeof b.startIso === "string" ? b.startIso : "";
    return ta.localeCompare(tb);
  });

  const phoneDigits: string[] = [];
  for (const b of bookings) {
    const p = typeof b.phone === "string" ? b.phone : "";
    const d = normalizeSmsDigits(p);
    if (d.length === 10) phoneDigits.push(d);
  }

  const smsLog = await mergeSmsLogsForPhoneDigits(phoneDigits, db);

  return { bookings, smsLog };
}
