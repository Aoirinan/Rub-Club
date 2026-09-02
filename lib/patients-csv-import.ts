import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { parseCsvRows } from "@/lib/csv-parse";
import {
  createPatient,
  findPatientByPhone,
  normalizePatientPhone,
  PATIENTS_COLLECTION,
  type PatientPaymentType,
} from "@/lib/patients-db";

function headerIndex(headers: string[], ...aliases: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const i = lower.indexOf(alias.toLowerCase());
    if (i >= 0) return i;
  }
  return -1;
}

function cell(row: string[], idx: number): string {
  if (idx < 0 || idx >= row.length) return "";
  return row[idx]?.trim() ?? "";
}

function parsePaymentType(raw: string): PatientPaymentType {
  const s = raw.trim().toLowerCase();
  if (s === "insurance") return "insurance";
  if (s === "mixed") return "mixed";
  return "cash";
}

export type PatientCsvImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  /** Data rows examined (excludes the header). */
  processed: number;
  /** Data rows in the file (excludes the header). */
  totalRows: number;
  /** True when the time budget ran out before every row was examined. */
  stoppedEarly: boolean;
};

/** Rows written concurrently; keeps a large file inside the function timeout. */
const CONCURRENCY = 5;
/** Stop before the serverless timeout so a partial summary is returned. */
const TIME_BUDGET_MS = 45_000;

export async function importPatientsFromCsv(
  db: Firestore,
  csvText: string,
  updateExisting: boolean,
): Promise<PatientCsvImportResult> {
  const startedAt = Date.now();
  const grid = parseCsvRows(csvText);
  if (grid.length < 2) {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: ["CSV must include a header row and at least one data row."],
      processed: 0,
      totalRows: Math.max(0, grid.length - 1),
      stoppedEarly: false,
    };
  }

  const headers = grid[0]!.map((h) => h.trim());
  const col = {
    firstName: headerIndex(headers, "first name", "firstname", "first"),
    lastName: headerIndex(headers, "last name", "lastname", "last"),
    phone: headerIndex(headers, "phone", "mobile", "cell"),
    email: headerIndex(headers, "email", "e-mail"),
    dob: headerIndex(headers, "date of birth", "dob", "birthdate"),
    address: headerIndex(headers, "address", "street"),
    city: headerIndex(headers, "city"),
    state: headerIndex(headers, "state"),
    zip: headerIndex(headers, "zip", "zip code", "postal"),
    paymentType: headerIndex(headers, "payment type", "payment"),
    insuranceCarrier: headerIndex(headers, "insurance carrier", "insurance", "carrier"),
    notes: headerIndex(headers, "notes", "note"),
  };

  if (col.firstName < 0 || col.phone < 0) {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: ["CSV must include First Name and Phone columns."],
      processed: 0,
      totalRows: grid.length - 1,
      stoppedEarly: false,
    };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let processed = 0;
  let stoppedEarly = false;
  const errors: string[] = [];
  const totalRows = grid.length - 1;

  // Pre-validate every row so the concurrent phase only sees usable rows.
  type Pending = { r: number; row: string[]; firstName: string; phone: string; key: string };
  const pending: Pending[] = [];
  for (let r = 1; r < grid.length; r++) {
    const row = grid[r]!;
    const firstName = cell(row, col.firstName);
    const phone = cell(row, col.phone);
    if (!firstName || !phone) {
      skipped++;
      processed++;
      continue;
    }
    const norm = normalizePatientPhone(phone);
    if (!norm) {
      errors.push(`Row ${r + 1}: invalid phone "${phone}"`);
      skipped++;
      processed++;
      continue;
    }
    pending.push({ r, row, firstName, phone, key: norm.phoneNormalized });
  }

  const importRow = async ({ r, row, firstName, phone }: Pending): Promise<void> => {
    try {
      const existing = await findPatientByPhone(db, phone);
      if (existing) {
        if (!updateExisting) {
          skipped++;
          return;
        }
        const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
        const lastName = cell(row, col.lastName);
        const email = cell(row, col.email);
        const dob = cell(row, col.dob);
        const address = cell(row, col.address);
        const city = cell(row, col.city);
        const state = cell(row, col.state);
        const zip = cell(row, col.zip);
        const pt = cell(row, col.paymentType);
        const carrier = cell(row, col.insuranceCarrier);
        const notes = cell(row, col.notes);

        if (!existing.lastName && lastName) patch.lastName = lastName;
        if (!existing.email && email) patch.email = email.toLowerCase();
        if (!existing.dateOfBirth && dob) patch.dateOfBirth = dob;
        if (!existing.address && address) patch.address = address;
        if (!existing.city && city) patch.city = city;
        if (!existing.state && state) patch.state = state;
        if (!existing.zip && zip) patch.zip = zip;
        if (existing.paymentType === "cash" && pt) patch.paymentType = parsePaymentType(pt);
        if (!existing.insuranceCarrier && carrier) patch.insuranceCarrier = carrier;
        if (!existing.notes && notes) patch.notes = notes;

        if (Object.keys(patch).length > 1) {
          await db.collection(PATIENTS_COLLECTION).doc(existing.id).update(patch);
          updated++;
        } else {
          skipped++;
        }
        return;
      }

      await createPatient(db, {
        firstName,
        lastName: cell(row, col.lastName),
        phone,
        email: cell(row, col.email),
        dateOfBirth: cell(row, col.dob) || undefined,
        address: cell(row, col.address) || undefined,
        city: cell(row, col.city) || undefined,
        state: cell(row, col.state) || undefined,
        zip: cell(row, col.zip) || undefined,
        paymentType: col.paymentType >= 0 ? parsePaymentType(cell(row, col.paymentType)) : "cash",
        insuranceCarrier: cell(row, col.insuranceCarrier) || undefined,
        notes: cell(row, col.notes) || undefined,
        source: "csv_import",
      });
      created++;
    } catch (e) {
      errors.push(`Row ${r + 1}: ${e instanceof Error ? e.message : "import failed"}`);
    }
  };

  // Process in small concurrent chunks. Rows that share a phone number are
  // never in the same chunk, so the phone-based dedupe stays reliable.
  let i = 0;
  while (i < pending.length) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      stoppedEarly = true;
      break;
    }
    const chunk: Pending[] = [];
    const keys = new Set<string>();
    while (i < pending.length && chunk.length < CONCURRENCY) {
      const next = pending[i]!;
      if (keys.has(next.key)) break;
      keys.add(next.key);
      chunk.push(next);
      i++;
    }
    await Promise.all(chunk.map(importRow));
    processed += chunk.length;
  }

  if (stoppedEarly) {
    errors.push(
      `Stopped after ${processed} of ${totalRows} rows to stay within the time limit. ` +
        `Re-upload the same file with "Update existing patients" checked to continue; rows already imported are skipped.`,
    );
  }

  return { created, updated, skipped, errors, processed, totalRows, stoppedEarly };
}
