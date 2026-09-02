import type { Firestore } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { nameSearchVariants } from "@/lib/patient-search-parse";

export { parsePatientLookupSearchParams, type PatientLookupParse } from "@/lib/patient-search-parse";

/**
 * Common ways a 10-digit US number is typed/stored on booking docs. Bookings
 * store the phone exactly as entered (public form and admin drawer), so the
 * lookup has to try the usual formats rather than a single canonical one.
 */
export function phoneVariantsForLookup(digits: string): string[] {
  const d = normalizeSmsDigits(digits);
  if (d.length === 10) {
    const a = d.slice(0, 3);
    const b = d.slice(3, 6);
    const c = d.slice(6);
    const out = [
      `${a}-${b}-${c}`,
      d,
      `+1${d}`,
      `1${d}`,
      `(${a}) ${b}-${c}`,
      `${a} ${b} ${c}`,
      `${a}.${b}.${c}`,
      `1-${a}-${b}-${c}`,
      `+1 ${a}-${b}-${c}`,
      `+1 (${a}) ${b}-${c}`,
    ];
    const raw = digits.trim();
    if (raw && !out.includes(raw)) out.push(raw);
    return out;
  }
  return [digits.trim()];
}

/**
 * Match `sms_send_log.phoneDigits` (10-digit US). Only a leading US country
 * code is stripped; anything else that is not exactly 10 digits is returned
 * as-is so callers can reject it instead of silently keeping the wrong digits
 * (e.g. an extension or an international number).
 */
export function normalizeSmsDigits(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
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
    .filter((k) => k.length === 10)
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
  const variants = phoneVariantsForLookup(digits);
  // Firestore `in` accepts up to 30 values; one query covers every variant.
  for (let i = 0; i < variants.length; i += 30) {
    const chunk = variants.slice(i, i + 30);
    const snap = await db.collection("bookings").where("phone", "in", chunk).limit(200).get();
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
