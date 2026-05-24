import { FieldValue, type DocumentData, type Firestore } from "firebase-admin/firestore";
import {
  PROVIDER_BG_COLOR_IDS,
  PROVIDER_TEXT_COLOR_IDS,
} from "./provider-colors";
import type { ServiceLine } from "./constants";
import {
  SCHEDULER_SERVICE_SEED,
  type SchedulerServiceDoc,
  type SchedulerServiceRow,
  type SchedulerServiceVisibility,
} from "./scheduler-service-types";

const SERVICE_LINES: ServiceLine[] = ["massage", "chiropractic", "stretch"];

function parseServiceLines(raw: unknown): ServiceLine[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const lines = raw.filter(
    (v): v is ServiceLine => typeof v === "string" && SERVICE_LINES.includes(v as ServiceLine),
  );
  return lines.length ? lines : undefined;
}

const COLLECTION = "scheduler_services";

function parseVisibility(raw: unknown): SchedulerServiceVisibility {
  if (raw === "admin_only" || raw === "customer_only" || raw === "both") return raw;
  return "both";
}

function parseColorId<T extends string>(raw: unknown, allowed: readonly T[]): T | null {
  if (typeof raw !== "string") return null;
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
}

export function parseSchedulerServiceDoc(
  id: string,
  data: DocumentData,
): SchedulerServiceRow | null {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) return null;
  const durationMinutes =
    typeof data.durationMinutes === "number" && data.durationMinutes > 0
      ? Math.round(data.durationMinutes)
      : 30;
  return {
    id,
    name,
    serviceLines: parseServiceLines(data.serviceLines),
    priceCents: typeof data.priceCents === "number" ? Math.max(0, Math.round(data.priceCents)) : 0,
    durationMinutes,
    bufferBeforeMinutes:
      typeof data.bufferBeforeMinutes === "number"
        ? Math.max(0, Math.round(data.bufferBeforeMinutes))
        : 0,
    bufferAfterMinutes:
      typeof data.bufferAfterMinutes === "number"
        ? Math.max(0, Math.round(data.bufferAfterMinutes))
        : 0,
    textColor: parseColorId(data.textColor, PROVIDER_TEXT_COLOR_IDS),
    bgColor: parseColorId(data.bgColor, PROVIDER_BG_COLOR_IDS),
    visibility: parseVisibility(data.visibility),
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    active: data.active !== false,
  };
}

export async function fetchAllSchedulerServices(db: Firestore): Promise<SchedulerServiceRow[]> {
  const snap = await db.collection(COLLECTION).orderBy("sortOrder").get();
  const rows: SchedulerServiceRow[] = [];
  for (const doc of snap.docs) {
    const row = parseSchedulerServiceDoc(doc.id, doc.data());
    if (row) rows.push(row);
  }
  return rows;
}

export async function fetchSchedulerServiceById(
  db: Firestore,
  id: string,
): Promise<SchedulerServiceRow | null> {
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return parseSchedulerServiceDoc(snap.id, snap.data()!);
}

export async function ensureSchedulerServicesSeeded(db: Firestore): Promise<boolean> {
  const snap = await db.collection(COLLECTION).limit(1).get();
  if (!snap.empty) return false;
  const batch = db.batch();
  SCHEDULER_SERVICE_SEED.forEach((seed, idx) => {
    const ref = db.collection(COLLECTION).doc();
    batch.set(ref, {
      ...seed,
      sortOrder: idx,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
  return true;
}

export async function reorderSchedulerServices(
  db: Firestore,
  orderedIds: string[],
): Promise<void> {
  const batch = db.batch();
  orderedIds.forEach((id, sortOrder) => {
    batch.update(db.collection(COLLECTION).doc(id), {
      sortOrder,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

export type SchedulerServiceWrite = Partial<SchedulerServiceDoc>;
