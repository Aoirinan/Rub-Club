/**
 * CSV booking import: header normalization, auto-detection, and optional column overrides.
 * Used by /api/admin/bookings/import and the admin scheduler UI.
 */

export type ColMap = {
  date: number;
  time: number;
  startIso: number;
  name: number;
  phone: number;
  email: number;
  service: number;
  duration: number;
  provider: number;
  providerId: number;
  location: number;
  status: number;
  notes: number;
  bookingId: number;
};

export type CsvImportColumnKey = keyof ColMap;

export const CSV_IMPORT_COLUMN_KEYS: CsvImportColumnKey[] = [
  "date",
  "time",
  "startIso",
  "name",
  "phone",
  "email",
  "service",
  "duration",
  "provider",
  "providerId",
  "location",
  "status",
  "notes",
  "bookingId",
];

export const CSV_IMPORT_FIELD_LABELS: Record<CsvImportColumnKey, string> = {
  name: "Patient name",
  service: "Service (massage / chiropractic)",
  duration: "Duration (minutes)",
  provider: "Provider name",
  providerId: "Provider ID",
  location: "Location",
  date: "Date",
  time: "Time",
  startIso: "Start (UTC ISO)",
  phone: "Phone",
  email: "Email",
  status: "Status",
  notes: "Notes",
  bookingId: "Booking ID",
};

export function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Map normalized header string -> column index. */
export function buildHeaderMap(headerRow: string[]): Map<string, number> {
  const m = new Map<string, number>();
  headerRow.forEach((cell, i) => {
    m.set(normHeader(cell), i);
  });
  return m;
}

function col(m: Map<string, number>, ...names: string[]): number {
  for (const n of names) {
    const i = m.get(normHeader(n));
    if (i !== undefined) return i;
  }
  return -1;
}

function resolveMappedIndex(
  m: Map<string, number>,
  fieldLabel: string,
  csvHeaderTitle: string,
): number | { error: string } {
  const t = csvHeaderTitle.trim();
  if (!t) return { error: `Column mapping for ${fieldLabel} is empty.` };
  const idx = m.get(normHeader(t));
  if (idx === undefined) {
    return {
      error: `Column mapping: no column named "${t}" for ${fieldLabel}. Use the exact header text from row 1 of the CSV.`,
    };
  }
  return idx;
}

function findDuplicateColumns(map: ColMap): string | null {
  const indexToFields = new Map<number, CsvImportColumnKey[]>();
  for (const key of CSV_IMPORT_COLUMN_KEYS) {
    const idx = map[key];
    if (idx < 0) continue;
    const arr = indexToFields.get(idx) ?? [];
    arr.push(key);
    indexToFields.set(idx, arr);
  }
  for (const [idx, fields] of indexToFields) {
    if (fields.length > 1) {
      return `Each CSV column can map to only one field. Column #${idx + 1} is mapped to: ${fields.map((f) => CSV_IMPORT_FIELD_LABELS[f]).join(", ")}.`;
    }
  }
  return null;
}

/**
 * Build column indices from the header row, optionally with per-field CSV header overrides.
 * `overrides` values must match a header cell (case/spacing-insensitive after normHeader).
 */
export function buildColMap(
  headerRow: string[],
  overrides?: Partial<Record<CsvImportColumnKey, string>>,
): ColMap | { error: string } {
  const m = buildHeaderMap(headerRow);

  const pick = (key: CsvImportColumnKey, auto: number, override?: string): number | { error: string } => {
    const raw = override?.trim();
    if (!raw) return auto;
    return resolveMappedIndex(m, CSV_IMPORT_FIELD_LABELS[key], raw);
  };

  const dateAuto = col(m, "Date", "date", "start_date", "appointment date");
  const timeAuto = col(m, "Time", "time", "start_time");
  const startIsoAuto = col(m, "start_iso", "start iso", "startIso");
  const nameAuto = col(m, "Patient Name", "patient name", "name", "customer name", "client name");
  const phoneAuto = col(m, "Phone", "phone", "phone number");
  const emailAuto = col(m, "Email", "email");
  const serviceAuto = col(
    m,
    "Service",
    "service line",
    "service_line",
    "Type",
    "type",
    "Appointment type",
    "Category",
    "category",
    "Modality",
    "modality",
  );
  const durationAuto = col(m, "Duration (min)", "duration (min)", "duration", "duration_min", "duration min");
  const providerAuto = col(m, "Provider", "provider name", "therapist", "doctor");
  const providerIdAuto = col(m, "provider_id", "provider id", "Provider ID");
  const locationAuto = col(m, "Location", "location", "office");
  const statusAuto = col(m, "Status", "status");
  const notesAuto = col(m, "Notes", "notes");
  const bookingIdAuto = col(m, "Booking ID", "booking id", "booking_id", "id");

  const o = overrides ?? {};

  const date = pick("date", dateAuto, o.date);
  const time = pick("time", timeAuto, o.time);
  const startIso = pick("startIso", startIsoAuto, o.startIso);
  const name = pick("name", nameAuto, o.name);
  const phone = pick("phone", phoneAuto, o.phone);
  const email = pick("email", emailAuto, o.email);
  const service = pick("service", serviceAuto, o.service);
  const duration = pick("duration", durationAuto, o.duration);
  const provider = pick("provider", providerAuto, o.provider);
  const providerId = pick("providerId", providerIdAuto, o.providerId);
  const location = pick("location", locationAuto, o.location);
  const status = pick("status", statusAuto, o.status);
  const notes = pick("notes", notesAuto, o.notes);
  const bookingId = pick("bookingId", bookingIdAuto, o.bookingId);

  const candidates = [
    date,
    time,
    startIso,
    name,
    phone,
    email,
    service,
    duration,
    provider,
    providerId,
    location,
    status,
    notes,
    bookingId,
  ];
  for (const c of candidates) {
    if (typeof c === "object" && "error" in c) return c;
  }

  const colMap: ColMap = {
    date: date as number,
    time: time as number,
    startIso: startIso as number,
    name: name as number,
    phone: phone as number,
    email: email as number,
    service: service as number,
    duration: duration as number,
    provider: provider as number,
    providerId: providerId as number,
    location: location as number,
    status: status as number,
    notes: notes as number,
    bookingId: bookingId as number,
  };

  const dupErr = findDuplicateColumns(colMap);
  if (dupErr) return { error: dupErr };

  if (colMap.name < 0) return { error: 'Missing required column: use "Patient Name" (or map "Patient name" in the import dialog).' };
  if (colMap.service < 0) {
    return { error: 'Missing required column: "Service" (massage or chiropractic), or map it in the import dialog.' };
  }
  if (colMap.duration < 0) {
    return { error: 'Missing required column: "Duration (min)" (30 or 60), or map it in the import dialog.' };
  }
  if (colMap.provider < 0 && colMap.providerId < 0) {
    return { error: 'Missing provider: add "Provider" or "provider_id", or map them in the import dialog.' };
  }
  if (colMap.location < 0) {
    return { error: 'Missing required column: "Location", or map it in the import dialog.' };
  }
  const hasWhen = colMap.startIso >= 0 || (colMap.date >= 0 && colMap.time >= 0);
  if (!hasWhen) {
    return { error: 'Missing time columns: need "Date" + "Time", or "start_iso", or map them in the import dialog.' };
  }
  if (colMap.startIso < 0 && (colMap.date < 0 || colMap.time < 0)) {
    return { error: 'Missing "Date" or "Time" column, or map start time columns in the import dialog.' };
  }

  return colMap;
}

/** Best-effort header titles from the file for UI defaults (exact substring from row 1). */
export function guessCsvImportSelections(headerRow: string[]): Record<CsvImportColumnKey, string> {
  const m = buildHeaderMap(headerRow);
  const at = (idx: number) => (idx >= 0 && idx < headerRow.length ? headerRow[idx]!.trim() : "");

  const out = {} as Record<CsvImportColumnKey, string>;
  out.date = at(col(m, "Date", "date", "start_date", "appointment date"));
  out.time = at(col(m, "Time", "time", "start_time"));
  out.startIso = at(col(m, "start_iso", "start iso", "startIso"));
  out.name = at(col(m, "Patient Name", "patient name", "name", "customer name", "client name"));
  out.phone = at(col(m, "Phone", "phone", "phone number"));
  out.email = at(col(m, "Email", "email"));
  out.service = at(
    col(m, "Service", "service line", "service_line", "Type", "type", "Appointment type", "Category", "category", "Modality", "modality"),
  );
  out.duration = at(col(m, "Duration (min)", "duration (min)", "duration", "duration_min", "duration min"));
  out.provider = at(col(m, "Provider", "provider name", "therapist", "doctor"));
  out.providerId = at(col(m, "provider_id", "provider id", "Provider ID"));
  out.location = at(col(m, "Location", "location", "office"));
  out.status = at(col(m, "Status", "status"));
  out.notes = at(col(m, "Notes", "notes"));
  out.bookingId = at(col(m, "Booking ID", "booking id", "booking_id", "id"));
  return out;
}

const COLUMN_MAP_ALIASES: Record<string, CsvImportColumnKey> = {
  name: "name",
  patientname: "name",
  patient_name: "name",
  service: "service",
  serviceline: "service",
  duration: "duration",
  durationmin: "duration",
  provider: "provider",
  providername: "provider",
  providerid: "providerId",
  provider_id: "providerId",
  location: "location",
  date: "date",
  time: "time",
  startiso: "startIso",
  start_iso: "startIso",
  phone: "phone",
  email: "email",
  status: "status",
  notes: "notes",
  bookingid: "bookingId",
  booking_id: "bookingId",
};

/** Parse optional JSON body field from multipart `columnMap`. */
export function parseColumnMapJson(raw: unknown): Partial<Record<CsvImportColumnKey, string>> | { error: string } {
  if (raw === null || raw === undefined || raw === "") return {};
  if (typeof raw !== "string") return { error: "columnMap must be a JSON string." };
  let obj: unknown;
  try {
    obj = JSON.parse(raw) as unknown;
  } catch {
    return { error: "columnMap is not valid JSON." };
  }
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return { error: "columnMap must be a JSON object." };
  }
  const out: Partial<Record<CsvImportColumnKey, string>> = {};
  const validKeys = new Set<string>(CSV_IMPORT_COLUMN_KEYS);
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const keyNorm = normHeader(k).replace(/\s+/g, "");
    const key: CsvImportColumnKey | undefined = validKeys.has(k)
      ? (k as CsvImportColumnKey)
      : COLUMN_MAP_ALIASES[keyNorm];
    if (!key) continue;
    if (typeof v !== "string") return { error: `columnMap.${k} must be a string (CSV header title).` };
    out[key] = v;
  }
  return out;
}
