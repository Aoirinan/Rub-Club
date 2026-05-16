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
};

export async function importPatientsFromCsv(
  db: Firestore,
  csvText: string,
  updateExisting: boolean,
): Promise<PatientCsvImportResult> {
  const grid = parseCsvRows(csvText);
  if (grid.length < 2) {
    return { created: 0, updated: 0, skipped: 0, errors: ["CSV must include a header row and at least one data row."] };
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
    };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let r = 1; r < grid.length; r++) {
    const row = grid[r]!;
    const firstName = cell(row, col.firstName);
    const phone = cell(row, col.phone);
    if (!firstName || !phone) {
      skipped++;
      continue;
    }

    const norm = normalizePatientPhone(phone);
    if (!norm) {
      errors.push(`Row ${r + 1}: invalid phone "${phone}"`);
      skipped++;
      continue;
    }

    try {
      const existing = await findPatientByPhone(db, phone);
      if (existing) {
        if (!updateExisting) {
          skipped++;
          continue;
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
        continue;
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
  }

  return { created, updated, skipped, errors };
}
