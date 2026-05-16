import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import { TIME_ZONE } from "@/lib/constants";
import { deletePatientStorage } from "@/lib/patient-insurance-upload";
import { phoneVariantsForLookup, normalizeSmsDigits } from "@/lib/patient-record-lookup";

export const PATIENTS_COLLECTION = "patients";

import type { PatientApiRow, PatientPaymentType } from "@/lib/patient-types";

export type { PatientApiRow, PatientPaymentType } from "@/lib/patient-types";
export type PatientSource = "online_booking" | "manual" | "csv_import";

export type PatientDoc = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneNormalized: string;
  email: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  paymentType: PatientPaymentType;
  insuranceCarrier?: string;
  insuranceMemberId?: string;
  insuranceCardFront?: string;
  insuranceCardBack?: string;
  notes?: string;
  source: PatientSource;
  deleted?: boolean;
  deletedAt?: Timestamp;
  totalVisits: number;
  totalCanceled: number;
  totalNoShow: number;
  totalConfirmed: number;
  totalPaid: number;
  lastVisitDate: Timestamp | null;
  nextAppointmentDate: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

function tsToMs(v: unknown): number | null {
  if (v instanceof Timestamp) return v.toMillis();
  return null;
}

export function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return digits.trim();
}

export function normalizePatientPhone(raw: string): { phone: string; phoneNormalized: string } | null {
  const digits = normalizeSmsDigits(raw);
  if (digits.length !== 10) return null;
  return { phone: formatPhoneDisplay(digits), phoneNormalized: digits };
}

export function splitBookingName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Unknown", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

function parsePaymentType(raw: unknown): PatientPaymentType {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (s === "insurance") return "insurance";
  if (s === "mixed") return "mixed";
  return "cash";
}

export function parsePatientDoc(id: string, data: DocumentData): PatientDoc | null {
  const firstName = typeof data.firstName === "string" ? data.firstName.trim() : "";
  const lastName = typeof data.lastName === "string" ? data.lastName.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  const phoneNormalized =
    typeof data.phoneNormalized === "string" ? data.phoneNormalized.trim() : normalizeSmsDigits(phone);
  if (!firstName || !phoneNormalized || phoneNormalized.length < 10) return null;

  return {
    id,
    firstName,
    lastName,
    phone: phone || formatPhoneDisplay(phoneNormalized),
    phoneNormalized,
    email: typeof data.email === "string" ? data.email.trim().toLowerCase() : "",
    dateOfBirth: typeof data.dateOfBirth === "string" ? data.dateOfBirth.trim() : undefined,
    address: typeof data.address === "string" ? data.address.trim() : undefined,
    city: typeof data.city === "string" ? data.city.trim() : undefined,
    state: typeof data.state === "string" ? data.state.trim() : undefined,
    zip: typeof data.zip === "string" ? data.zip.trim() : undefined,
    paymentType: parsePaymentType(data.paymentType),
    insuranceCarrier:
      typeof data.insuranceCarrier === "string" ? data.insuranceCarrier.trim() : undefined,
    insuranceMemberId:
      typeof data.insuranceMemberId === "string" ? data.insuranceMemberId.trim() : undefined,
    insuranceCardFront:
      typeof data.insuranceCardFront === "string" ? data.insuranceCardFront.trim() : undefined,
    insuranceCardBack:
      typeof data.insuranceCardBack === "string" ? data.insuranceCardBack.trim() : undefined,
    notes: typeof data.notes === "string" ? data.notes.trim() : undefined,
    source:
      data.source === "online_booking" || data.source === "manual" || data.source === "csv_import"
        ? data.source
        : "manual",
    deleted: data.deleted === true,
    deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt : undefined,
    totalVisits: typeof data.totalVisits === "number" ? data.totalVisits : 0,
    totalCanceled: typeof data.totalCanceled === "number" ? data.totalCanceled : 0,
    totalNoShow: typeof data.totalNoShow === "number" ? data.totalNoShow : 0,
    totalConfirmed: typeof data.totalConfirmed === "number" ? data.totalConfirmed : 0,
    totalPaid: typeof data.totalPaid === "number" ? data.totalPaid : 0,
    lastVisitDate: data.lastVisitDate instanceof Timestamp ? data.lastVisitDate : null,
    nextAppointmentDate:
      data.nextAppointmentDate instanceof Timestamp ? data.nextAppointmentDate : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
  };
}

export function patientToApiRow(p: PatientDoc): PatientApiRow {
  const { createdAt, updatedAt, lastVisitDate, nextAppointmentDate, deletedAt, ...rest } = p;
  void deletedAt;
  return {
    ...rest,
    createdAtMs: tsToMs(createdAt),
    updatedAtMs: tsToMs(updatedAt),
    lastVisitDateMs: tsToMs(lastVisitDate),
    nextAppointmentDateMs: tsToMs(nextAppointmentDate),
  };
}

export async function findPatientByPhone(
  db: Firestore,
  rawPhone: string,
): Promise<PatientDoc | null> {
  const norm = normalizePatientPhone(rawPhone);
  if (!norm) {
    for (const pv of phoneVariantsForLookup(rawPhone)) {
      const snap = await db.collection(PATIENTS_COLLECTION).where("phone", "==", pv).limit(1).get();
      if (!snap.empty) {
        const doc = snap.docs[0]!;
        const parsed = parsePatientDoc(doc.id, doc.data());
        if (parsed && !parsed.deleted) return parsed;
      }
    }
    return null;
  }

  const snap = await db
    .collection(PATIENTS_COLLECTION)
    .where("phoneNormalized", "==", norm.phoneNormalized)
    .limit(5)
    .get();

  for (const doc of snap.docs) {
    const parsed = parsePatientDoc(doc.id, doc.data());
    if (parsed && !parsed.deleted) return parsed;
  }
  return null;
}

export type CreatePatientInput = {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  paymentType?: PatientPaymentType;
  insuranceCarrier?: string;
  insuranceMemberId?: string;
  notes?: string;
  source: PatientSource;
};

export async function createPatient(
  db: Firestore,
  input: CreatePatientInput,
): Promise<{ patient: PatientDoc; created: boolean; existingId?: string }> {
  const existing = await findPatientByPhone(db, input.phone);
  if (existing) {
    return { patient: existing, created: false, existingId: existing.id };
  }

  const norm = normalizePatientPhone(input.phone);
  if (!norm) {
    throw new Error("Invalid phone number");
  }

  const ref = db.collection(PATIENTS_COLLECTION).doc();
  const doc: Record<string, unknown> = {
    firstName: input.firstName.trim(),
    lastName: (input.lastName ?? "").trim(),
    phone: norm.phone,
    phoneNormalized: norm.phoneNormalized,
    email: (input.email ?? "").trim().toLowerCase(),
    paymentType: input.paymentType ?? "cash",
    source: input.source,
    totalVisits: 0,
    totalCanceled: 0,
    totalNoShow: 0,
    totalConfirmed: 0,
    totalPaid: 0,
    lastVisitDate: null,
    nextAppointmentDate: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const optional = [
    "dateOfBirth",
    "address",
    "city",
    "state",
    "zip",
    "insuranceCarrier",
    "insuranceMemberId",
    "notes",
  ] as const;
  for (const key of optional) {
    const v = input[key];
    if (typeof v === "string" && v.trim()) doc[key] = v.trim();
  }

  await ref.set(doc);
  const snap = await ref.get();
  const parsed = parsePatientDoc(ref.id, snap.data() ?? {});
  if (!parsed) throw new Error("Failed to create patient");
  return { patient: parsed, created: true };
}

export async function findOrCreatePatientFromBooking(
  db: Firestore,
  opts: {
    name: string;
    phone: string;
    email?: string;
    paymentType?: PatientPaymentType;
    source: PatientSource;
    startAt?: Timestamp | null;
  },
): Promise<string | null> {
  const phone = opts.phone.trim();
  if (!phone) return null;

  const { firstName, lastName } = splitBookingName(opts.name);
  const result = await createPatient(db, {
    firstName,
    lastName,
    phone,
    email: opts.email,
    paymentType: opts.paymentType,
    source: opts.source,
  });

  const patientId = result.patient.id;

  if (opts.startAt) {
    await maybeUpdateNextAppointment(db, patientId, opts.startAt);
  }

  return patientId;
}

export async function maybeUpdateNextAppointment(
  db: Firestore,
  patientId: string,
  startAt: Timestamp,
): Promise<void> {
  const now = Timestamp.now();
  if (startAt.toMillis() <= now.toMillis()) return;

  const ref = db.collection(PATIENTS_COLLECTION).doc(patientId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const cur = snap.get("nextAppointmentDate");
  if (cur instanceof Timestamp && cur.toMillis() <= startAt.toMillis()) return;
  if (cur instanceof Timestamp && cur.toMillis() < startAt.toMillis()) {
    await ref.update({
      nextAppointmentDate: startAt,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }
  if (!(cur instanceof Timestamp)) {
    await ref.update({
      nextAppointmentDate: startAt,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

export async function linkBookingToPatient(
  db: Firestore,
  bookingRef: DocumentReference,
  bookingData: DocumentData,
  source: PatientSource,
  opts?: { bumpStats?: boolean },
): Promise<void> {
  const existingPatientId =
    typeof bookingData.patientId === "string" ? bookingData.patientId.trim() : "";
  if (existingPatientId) return;

  const phone = typeof bookingData.phone === "string" ? bookingData.phone : "";
  const name = typeof bookingData.name === "string" ? bookingData.name : "";
  if (!phone.trim() || !name.trim()) return;

  const paymentType =
    bookingData.paymentType === "insurance"
      ? "insurance"
      : bookingData.paymentType === "cash"
        ? "cash"
        : undefined;

  const startAt = bookingData.startAt instanceof Timestamp ? bookingData.startAt : null;

  const patientId = await findOrCreatePatientFromBooking(db, {
    name,
    phone,
    email: typeof bookingData.email === "string" ? bookingData.email : undefined,
    paymentType,
    source,
    startAt,
  });

  if (!patientId) return;

  await bookingRef.update({ patientId });

  if (opts?.bumpStats !== false && bookingData.status === "confirmed") {
    await incrementPatientStat(db, patientId, "totalConfirmed", 1);
  }
}

export async function linkBookingAfterCreate(
  db: Firestore,
  bookingId: string,
  source: PatientSource,
): Promise<void> {
  const snap = await db.collection("bookings").doc(bookingId).get();
  if (!snap.exists) return;
  await linkBookingToPatient(db, snap.ref, snap.data() ?? {}, source, { bumpStats: true });
}

export type PatientStatField =
  | "totalVisits"
  | "totalCanceled"
  | "totalNoShow"
  | "totalConfirmed";

export async function incrementPatientStat(
  db: Firestore,
  patientId: string,
  field: PatientStatField,
  delta: number,
): Promise<void> {
  if (!delta) return;
  const ref = db.collection(PATIENTS_COLLECTION).doc(patientId);
  await ref.update({
    [field]: FieldValue.increment(delta),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function onBookingCheckedIn(
  db: Firestore,
  patientId: string,
  at: Timestamp,
): Promise<void> {
  const ref = db.collection(PATIENTS_COLLECTION).doc(patientId);
  await ref.update({
    totalVisits: FieldValue.increment(1),
    lastVisitDate: at,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function onBookingStatusChange(
  db: Firestore,
  patientId: string,
  prevStatus: string | undefined,
  nextStatus: string,
): Promise<void> {
  if (prevStatus === nextStatus) return;
  if (nextStatus === "confirmed" && prevStatus !== "confirmed") {
    await incrementPatientStat(db, patientId, "totalConfirmed", 1);
  }
  if (nextStatus === "cancelled" && prevStatus !== "cancelled") {
    await incrementPatientStat(db, patientId, "totalCanceled", 1);
  }
}

export async function listPatients(opts: {
  search?: string;
  page?: number;
  limit?: number;
  paymentType?: PatientPaymentType | "all";
  activeOnly?: boolean;
}): Promise<{ patients: PatientApiRow[]; total: number; page: number; limit: number }> {
  const db = getFirestore();
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const page = Math.max(1, opts.page ?? 1);
  const search = opts.search?.trim().toLowerCase() ?? "";

  const snap = await db.collection(PATIENTS_COLLECTION).orderBy("lastName", "asc").limit(2000).get();

  let rows: PatientDoc[] = [];
  for (const doc of snap.docs) {
    const parsed = parsePatientDoc(doc.id, doc.data());
    if (!parsed || parsed.deleted) continue;
    rows.push(parsed);
  }

  if (opts.paymentType && opts.paymentType !== "all") {
    rows = rows.filter((p) => p.paymentType === opts.paymentType);
  }

  if (opts.activeOnly) {
    const cutoff = DateTime.now().setZone(TIME_ZONE).minus({ months: 12 }).toMillis();
    const now = Date.now();
    rows = rows.filter((p) => {
      const last = tsToMs(p.lastVisitDate);
      const next = tsToMs(p.nextAppointmentDate);
      return (last !== null && last >= cutoff) || (next !== null && next >= now);
    });
  }

  if (search) {
    const digits = search.replace(/\D/g, "");
    rows = rows.filter((p) => {
      const full = `${p.firstName} ${p.lastName}`.toLowerCase();
      if (full.includes(search)) return true;
      if (p.email.toLowerCase().includes(search)) return true;
      if (digits.length >= 3 && p.phoneNormalized.includes(digits)) return true;
      if (p.phone.toLowerCase().includes(search)) return true;
      return false;
    });
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  const slice = rows.slice(start, start + limit).map(patientToApiRow);

  return { patients: slice, total, page, limit };
}

export async function getPatientBookings(
  patientId: string,
  limit = 200,
): Promise<Record<string, unknown>[]> {
  const db = getFirestore();
  const snap = await db
    .collection("bookings")
    .where("patientId", "==", patientId)
    .limit(limit)
    .get();

  const rows = snap.docs.map((d) => {
    const data = d.data();
    const startAtMs = data.startAt instanceof Timestamp ? data.startAt.toMillis() : null;
    const checkedInAtMs =
      data.checkedInAt instanceof Timestamp ? data.checkedInAt.toMillis() : null;
    const paidAtMs = data.paidAt instanceof Timestamp ? data.paidAt.toMillis() : null;
    return {
      id: d.id,
      ...data,
      startAtMs,
      checkedInAtMs,
      paidAtMs,
      paidAmountCents: typeof data.paidAmountCents === "number" ? data.paidAmountCents : null,
    };
  });

  rows.sort((a, b) => {
    const ta = typeof a.startAtMs === "number" ? a.startAtMs : 0;
    const tb = typeof b.startAtMs === "number" ? b.startAtMs : 0;
    return tb - ta;
  });

  return rows;
}

/** Recompute stored visit/payment stats from all bookings linked to this patient. */
export async function recalculatePatientStats(db: Firestore, patientId: string): Promise<void> {
  const snap = await db.collection("bookings").where("patientId", "==", patientId).get();
  const nowMs = Date.now();

  let totalVisits = 0;
  let totalCanceled = 0;
  let totalNoShow = 0;
  let totalConfirmed = 0;
  let totalPaid = 0;
  let lastVisitDate: Timestamp | null = null;
  let nextAppointmentDate: Timestamp | null = null;

  for (const doc of snap.docs) {
    const d = doc.data();
    const status = typeof d.status === "string" ? d.status : "pending";
    const startAt = d.startAt instanceof Timestamp ? d.startAt : null;
    const checkedInAt = d.checkedInAt instanceof Timestamp ? d.checkedInAt : null;

    if (status === "cancelled") totalCanceled++;
    if (status === "confirmed") {
      totalConfirmed++;
      if (startAt && startAt.toMillis() < nowMs && !checkedInAt) totalNoShow++;
    }
    if (checkedInAt) {
      totalVisits++;
      if (!lastVisitDate || checkedInAt.toMillis() > lastVisitDate.toMillis()) {
        lastVisitDate = checkedInAt;
      }
    }

    const paidCents = typeof d.paidAmountCents === "number" ? d.paidAmountCents : 0;
    if (paidCents > 0) totalPaid += paidCents / 100;

    if (startAt && startAt.toMillis() > nowMs && status !== "cancelled" && status !== "declined") {
      if (!nextAppointmentDate || startAt.toMillis() < nextAppointmentDate.toMillis()) {
        nextAppointmentDate = startAt;
      }
    }
  }

  await db.collection(PATIENTS_COLLECTION).doc(patientId).update({
    totalVisits,
    totalCanceled,
    totalNoShow,
    totalConfirmed,
    totalPaid,
    lastVisitDate: lastVisitDate ?? null,
    nextAppointmentDate: nextAppointmentDate ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export function inferBookingPatientSource(data: DocumentData): PatientSource {
  if (typeof data.sourceIp === "string" && data.sourceIp.trim()) return "online_booking";
  return "manual";
}

/** Remove patient record, insurance files, and booking links. */
export async function deletePatientPermanently(db: Firestore, patientId: string): Promise<void> {
  const bookingsSnap = await db.collection("bookings").where("patientId", "==", patientId).get();
  const batchSize = 400;
  for (let i = 0; i < bookingsSnap.docs.length; i += batchSize) {
    const batch = db.batch();
    for (const doc of bookingsSnap.docs.slice(i, i + batchSize)) {
      batch.update(doc.ref, { patientId: FieldValue.delete() });
    }
    await batch.commit();
  }

  await deletePatientStorage(patientId).catch(() => {});
  await db.collection(PATIENTS_COLLECTION).doc(patientId).delete();
}
