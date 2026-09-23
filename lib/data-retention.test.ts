import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { runDataRetentionPurge } from "./data-retention";

/**
 * Minimal in-memory stand-in for the Firestore calls data-retention makes:
 * collection().where(field, "<" | "==", v).limit(n).get(), doc().get(),
 * doc().collection().get(), batch().delete()/commit() and ref.delete().
 */
type Row = Record<string, unknown>;

function fakeDb(seed: Record<string, Record<string, Row>>) {
  const store = new Map<string, Map<string, Row>>();
  for (const [col, docs] of Object.entries(seed)) {
    store.set(col, new Map(Object.entries(docs)));
  }
  const col = (path: string) => {
    if (!store.has(path)) store.set(path, new Map());
    return store.get(path)!;
  };
  const docRef = (path: string, id: string) => ({
    id,
    path: `${path}/${id}`,
    delete: async () => {
      col(path).delete(id);
    },
    get: async () => snapshot(path, id, col(path).get(id)),
    collection: (sub: string) => collection(`${path}/${id}/${sub}`),
  });
  const snapshot = (path: string, id: string, data: Row | undefined) => ({
    id,
    exists: data !== undefined,
    ref: docRef(path, id),
    data: () => data,
    get: (field: string) => data?.[field],
  });
  const cmp = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : v);
  const query = (path: string, filters: [string, string, unknown][], max?: number) => ({
    where: (f: string, op: string, v: unknown) => query(path, [...filters, [f, op, v]], max),
    limit: (n: number) => query(path, filters, n),
    get: async () => {
      let rows = [...col(path).entries()].filter(([, d]) =>
        filters.every(([f, op, v]) => {
          const a = cmp(d[f]);
          const b = cmp(v);
          if (a === undefined) return false;
          if (op === "<") return (a as number) < (b as number);
          if (op === "==") return a === b;
          throw new Error(`unsupported op ${op}`);
        }),
      );
      if (max !== undefined) rows = rows.slice(0, max);
      const docs = rows.map(([id, d]) => snapshot(path, id, d));
      return { docs, size: docs.length, empty: docs.length === 0 };
    },
  });
  const collection = (path: string) => ({
    ...query(path, []),
    doc: (id: string) => docRef(path, id),
  });
  const db = {
    collection,
    batch: () => {
      const ops: (() => Promise<void>)[] = [];
      return {
        delete: (ref: { delete: () => Promise<void> }) => ops.push(() => ref.delete()),
        commit: async () => {
          for (const op of ops) await op();
        },
      };
    },
  };
  return { db: db as unknown as Firestore, store };
}

const old = Timestamp.fromMillis(Date.UTC(2010, 0, 1));
const recent = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);

function seed() {
  return {
    bookings: {
      b_old: { startAt: old, createdAt: old, patientId: "p_gone" },
      b_old2: { startAt: old, createdAt: old, patientId: "p_keep" },
      b_new: { startAt: recent, createdAt: recent, patientId: "p_keep" },
    },
    patients: {
      p_gone: { lastVisitDate: old, createdAt: old },
      p_keep: { lastVisitDate: old, createdAt: old },
    },
    sms_send_log: { s_old: { sentAt: old }, s_new: { sentAt: recent } },
    notifications_log: {
      n_old: { sentAt: old, phone: "+19035550101", message: "Reminder" },
      n_new: { sentAt: recent, phone: "+19035550101", message: "Reminder" },
    },
  };
}

describe("runDataRetentionPurge", () => {
  const envKeys = ["DATA_RETENTION_ENABLED", "DATA_RETENTION_MAX_NOTIFICATIONS"] as const;
  const saved: Partial<Record<(typeof envKeys)[number], string | undefined>> = {};
  beforeEach(() => {
    for (const k of envKeys) saved[k] = process.env[k];
  });
  afterEach(() => {
    for (const k of envKeys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    vi.restoreAllMocks();
  });

  it("does nothing when retention is disabled", async () => {
    delete process.env.DATA_RETENTION_ENABLED;
    const { db, store } = fakeDb(seed());
    const spy = vi.spyOn(db, "collection");
    const result = await runDataRetentionPurge({ dryRun: false, db });
    expect(result.disabled).toBe(true);
    expect(result.deletedNotifications).toBe(0);
    expect(spy).not.toHaveBeenCalled();
    expect(store.get("notifications_log")!.size).toBe(2);
  });

  it("dry run counts the same deletions as a real run, without deleting", async () => {
    delete process.env.DATA_RETENTION_ENABLED;
    const dry = fakeDb(seed());
    const preview = await runDataRetentionPurge({ dryRun: true, db: dry.db });
    expect(preview).toMatchObject({
      dryRun: true,
      deletedBookings: 2,
      deletedSms: 1,
      deletedNotifications: 1,
      // p_gone's only booking is purged; p_keep still has a recent one.
      deletedPatients: 1,
    });
    expect(dry.store.get("bookings")!.size).toBe(3);
    expect(dry.store.get("notifications_log")!.size).toBe(2);
    expect(dry.store.get("patients")!.size).toBe(2);

    process.env.DATA_RETENTION_ENABLED = "true";
    const live = fakeDb(seed());
    const executed = await runDataRetentionPurge({ dryRun: false, db: live.db });
    expect(executed).toMatchObject({
      dryRun: false,
      deletedBookings: preview.deletedBookings,
      deletedSms: preview.deletedSms,
      deletedNotifications: preview.deletedNotifications,
      deletedPatients: preview.deletedPatients,
    });
    expect([...live.store.get("notifications_log")!.keys()]).toEqual(["n_new"]);
    expect([...live.store.get("patients")!.keys()]).toEqual(["p_keep"]);
  });

  it("caps notification deletions per run", async () => {
    process.env.DATA_RETENTION_ENABLED = "true";
    process.env.DATA_RETENTION_MAX_NOTIFICATIONS = "1";
    const s = seed();
    const { db, store } = fakeDb({
      ...s,
      notifications_log: { ...s.notifications_log, n_old2: { sentAt: old } },
    });
    const result = await runDataRetentionPurge({ dryRun: false, db });
    expect(result.deletedNotifications).toBe(1);
    expect(result.truncated).toBe(true);
    expect(store.get("notifications_log")!.size).toBe(2);
  });
});
