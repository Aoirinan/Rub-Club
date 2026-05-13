import type { DocumentData, Firestore } from "firebase-admin/firestore";
import type { LocationId, ServiceLine } from "./constants";
import type { ProviderDaySchedule, ProviderDoc, ProviderRow } from "./provider-types";

function asLocationIds(raw: unknown): LocationId[] | null {
  if (!Array.isArray(raw)) return null;
  const out: LocationId[] = [];
  for (const x of raw) {
    if (x === "paris" || x === "sulphur_springs") out.push(x);
  }
  return out.length ? out : null;
}

function asServiceLines(raw: unknown): ServiceLine[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ServiceLine[] = [];
  for (const x of raw) {
    if (x === "massage" || x === "chiropractic") out.push(x);
  }
  return out.length ? out : null;
}

function asSchedule(raw: unknown): ProviderDaySchedule | null | undefined {
  if (raw === null || raw === undefined) return raw as null | undefined;
  if (typeof raw !== "object" || raw === null) return undefined;
  const o = raw as Record<string, unknown>;
  const nums = ["openHour", "openMinute", "closeHour", "closeMinute"] as const;
  const parts: Partial<ProviderDaySchedule> = {};
  for (const k of nums) {
    const n = o[k];
    if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
    parts[k] = Math.trunc(n);
  }
  return parts as ProviderDaySchedule;
}

export function parseProviderDoc(id: string, data: DocumentData): ProviderRow | null {
  const displayName = typeof data.displayName === "string" ? data.displayName.trim() : "";
  if (!displayName) return null;
  const active = data.active === true;
  const locationIds = asLocationIds(data.locationIds);
  const serviceLines = asServiceLines(data.serviceLines);
  if (!locationIds || !serviceLines) return null;
  const sortOrder = typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder) ? data.sortOrder : 0;
  const schedule = asSchedule(data.schedule);
  const doc: ProviderDoc = {
    displayName,
    active,
    locationIds,
    serviceLines,
    sortOrder,
    ...(schedule !== undefined ? { schedule } : {}),
  };
  return { id, ...doc };
}

export function compareProvidersForAssignment(a: ProviderRow, b: ProviderRow): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  const an = a.displayName.toLowerCase();
  const bn = b.displayName.toLowerCase();
  if (an !== bn) return an.localeCompare(bn);
  return a.id.localeCompare(b.id);
}

export async function fetchAllProviders(db: Firestore): Promise<ProviderRow[]> {
  const snap = await db.collection("providers").get();
  const rows: ProviderRow[] = [];
  for (const d of snap.docs) {
    const row = parseProviderDoc(d.id, d.data());
    if (row) rows.push(row);
  }
  rows.sort(compareProvidersForAssignment);
  return rows;
}

export async function fetchActiveProvidersForService(
  db: Firestore,
  locationId: LocationId,
  serviceLine: ServiceLine,
): Promise<ProviderRow[]> {
  const snap = await db.collection("providers").where("active", "==", true).get();
  const rows: ProviderRow[] = [];
  for (const d of snap.docs) {
    const row = parseProviderDoc(d.id, d.data());
    if (!row) continue;
    if (!row.locationIds.includes(locationId)) continue;
    if (!row.serviceLines.includes(serviceLine)) continue;
    rows.push(row);
  }
  rows.sort(compareProvidersForAssignment);
  return rows;
}

export async function fetchProviderById(db: Firestore, id: string): Promise<ProviderRow | null> {
  const snap = await db.collection("providers").doc(id).get();
  if (!snap.exists) return null;
  return parseProviderDoc(snap.id, snap.data()!);
}

export function orderProvidersForAnyBooking(
  eligible: ProviderRow[],
  preferredProviderId?: string | null,
): ProviderRow[] {
  const sorted = [...eligible].sort(compareProvidersForAssignment);
  const prefId = preferredProviderId?.trim();
  if (!prefId) return sorted;
  const pref = sorted.find((p) => p.id === prefId);
  if (!pref) return sorted;
  return [pref, ...sorted.filter((p) => p.id !== prefId)];
}
