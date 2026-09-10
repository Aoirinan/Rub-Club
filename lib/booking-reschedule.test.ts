import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { TIME_ZONE } from "./constants";
import { rescheduleBookingForStartChange, updateBookingSchedule } from "./booking-reschedule";

/**
 * Minimal in-memory stand-in for the Admin SDK surface these functions use:
 * doc get/set/update/delete, a providers `where("active","==",true)` query and
 * a transaction that applies writes only when the body resolves.
 */
type Docs = Map<string, Record<string, unknown>>;

function makeDb(docs: Docs) {
  const pathOf = (col: string, id: string) => `${col}/${id}`;

  const makeSnap = (col: string, id: string) => {
    const data = docs.get(pathOf(col, id));
    return {
      id,
      exists: data !== undefined,
      data: () => data,
      get: (field: string) => data?.[field],
      ref: { __col: col, __id: id },
    };
  };

  const writes: { op: string; path: string; data?: Record<string, unknown> }[] = [];

  const applySet = (col: string, id: string, data: Record<string, unknown>) => {
    docs.set(pathOf(col, id), { ...data });
    writes.push({ op: "set", path: pathOf(col, id), data });
  };
  const applyUpdate = (col: string, id: string, data: Record<string, unknown>) => {
    const cur = docs.get(pathOf(col, id)) ?? {};
    docs.set(pathOf(col, id), { ...cur, ...data });
    writes.push({ op: "update", path: pathOf(col, id), data });
  };
  const applyDelete = (col: string, id: string) => {
    docs.delete(pathOf(col, id));
    writes.push({ op: "delete", path: pathOf(col, id) });
  };

  const collection = (col: string) => ({
    doc: (id?: string) => {
      const docId = id ?? `auto_${Math.random().toString(36).slice(2)}`;
      return {
        id: docId,
        __col: col,
        __id: docId,
        get: async () => makeSnap(col, docId),
        collection: (sub: string) => collection(`${col}/${docId}/${sub}`),
      };
    },
    where: () => ({
      get: async () => {
        const out: ReturnType<typeof makeSnap>[] = [];
        for (const key of docs.keys()) {
          const [c, id] = key.split("/");
          if (c === col && id) {
            const snap = makeSnap(col, id);
            if (snap.data()?.active === true) out.push(snap);
          }
        }
        return { docs: out, empty: out.length === 0 };
      },
    }),
  });

  const db = {
    collection,
    runTransaction: async (fn: (tx: unknown) => Promise<void>) => {
      const staged: (() => void)[] = [];
      const tx = {
        get: async (ref: { __col: string; __id: string }) => makeSnap(ref.__col, ref.__id),
        set: (ref: { __col: string; __id: string }, data: Record<string, unknown>) =>
          staged.push(() => applySet(ref.__col, ref.__id, data)),
        update: (ref: { __col: string; __id: string }, data: Record<string, unknown>) =>
          staged.push(() => applyUpdate(ref.__col, ref.__id, data)),
        delete: (ref: { __col: string; __id: string }) =>
          staged.push(() => applyDelete(ref.__col, ref.__id)),
      };
      await fn(tx);
      for (const w of staged) w();
    },
    __writes: writes,
  };
  return db as unknown as Firestore & { __writes: typeof writes };
}

const ACTOR = { uid: "staff1", email: "desk@example.com" };
const OPTS = { allowPending: true };

/** A weekday well inside the 90-day horizon, at 10:00 Chicago. */
function futureStart(daysAhead = 7): DateTime {
  return DateTime.now()
    .setZone(TIME_ZONE)
    .plus({ days: daysAhead })
    .set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
}

/** Mirrors bucketDocId() in lib/slots-luxon.ts. */
function bucketKey(slot: DateTime, providerId = "p1"): string {
  return `paris__${providerId}__${slot.toFormat("yyyy-LL-dd")}__${slot.toFormat("HHmm")}`;
}

function seed(overrides: Record<string, unknown> = {}): { docs: Docs; startIso: string } {
  const start = futureStart();
  const startIso = start.toUTC().toISO()!;
  const docs: Docs = new Map();
  docs.set("bookings/b1", {
    status: "confirmed",
    locationId: "paris",
    serviceLine: "massage",
    durationMin: 60,
    providerId: "p1",
    providerDisplayName: "Alex",
    startIso,
    bucketIds: [],
    ...overrides,
  });
  // Two providers, both bookable for massage at Paris.
  docs.set("providers/p1", {
    displayName: "Alex",
    active: true,
    locationIds: ["paris"],
    serviceLines: ["massage", "stretch"],
    sortOrder: 0,
  });
  docs.set("providers/p2", {
    displayName: "Sam",
    active: true,
    locationIds: ["paris"],
    serviceLines: ["massage"],
    sortOrder: 1,
  });
  return { docs, startIso };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("updateBookingSchedule", () => {
  it("reports no change when nothing is different", async () => {
    const { docs, startIso } = seed();
    const db = makeDb(docs);
    const res = await updateBookingSchedule(db, "b1", { startIso }, ACTOR, OPTS);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.changed).toBe(false);
    expect(res.anyChange).toBe(false);
    // A no-op must not touch the booking at all.
    expect(db.__writes.length).toBe(0);
  });

  it("moving only the time writes just start/buckets and flags a patient-visible change", async () => {
    const { docs } = seed();
    const db = makeDb(docs);
    const newIso = futureStart(8).toUTC().toISO()!;

    const res = await updateBookingSchedule(db, "b1", { startIso: newIso }, ACTOR, OPTS);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.changed).toBe(true);
    expect(res.providerChanged).toBe(false);
    expect(res.serviceChanged).toBe(false);

    const update = db.__writes.find((w) => w.op === "update" && w.path === "bookings/b1");
    expect(update).toBeTruthy();
    // Patient-portal behaviour: only these three fields move.
    expect(Object.keys(update!.data!).sort()).toEqual(["bucketIds", "startAt", "startIso"]);
  });

  it("rescheduleBookingForStartChange behaves the same as a startIso-only update", async () => {
    const a = seed();
    const b = seed();
    const dbA = makeDb(a.docs);
    const dbB = makeDb(b.docs);
    const newIso = futureStart(9).toUTC().toISO()!;

    const viaLegacy = await rescheduleBookingForStartChange(dbA, "b1", newIso, ACTOR, OPTS);
    const viaNew = await updateBookingSchedule(dbB, "b1", { startIso: newIso }, ACTOR, OPTS);

    expect(viaLegacy.ok && viaNew.ok).toBe(true);
    if (!viaLegacy.ok || !viaNew.ok) return;
    expect(viaLegacy.changed).toBe(viaNew.changed);
    expect(viaLegacy.newStartIso).toBe(viaNew.newStartIso);
    const keysA = dbA.__writes
      .filter((w) => w.path === "bookings/b1")
      .flatMap((w) => Object.keys(w.data ?? {}))
      .sort();
    const keysB = dbB.__writes
      .filter((w) => w.path === "bookings/b1")
      .flatMap((w) => Object.keys(w.data ?? {}))
      .sort();
    expect(keysA).toEqual(keysB);
  });

  it("changing provider writes the new provider and its display name", async () => {
    const { docs } = seed();
    const db = makeDb(docs);

    const res = await updateBookingSchedule(db, "b1", { providerId: "p2" }, ACTOR, OPTS);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.providerChanged).toBe(true);
    // Provider-only edits must NOT trigger the patient reschedule email.
    expect(res.changed).toBe(false);

    const update = db.__writes.find((w) => w.op === "update" && w.path === "bookings/b1");
    expect(update!.data!.providerId).toBe("p2");
    expect(update!.data!.providerDisplayName).toBe("Sam");
  });

  it("refuses a provider who is not bookable for the target service line", async () => {
    const { docs } = seed();
    const db = makeDb(docs);
    // p2 has no "stretch" service line.
    const res = await updateBookingSchedule(
      db,
      "b1",
      { providerId: "p2", serviceLine: "stretch" },
      ACTOR,
      OPTS,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("no_provider");
  });

  it("rejects a duration that is not on the 30-minute grid", async () => {
    const { docs } = seed();
    const db = makeDb(docs);
    const res = await updateBookingSchedule(db, "b1", { durationMin: 45 }, ACTOR, OPTS);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("invalid_duration");
  });

  it("detects a conflict when the target slot belongs to another booking", async () => {
    const { docs } = seed();
    const target = futureStart(10);
    // Occupy every bucket the moved appointment would need.
    for (const offset of [0, 30]) {
      const slot = target.plus({ minutes: offset });
      docs.set(`slot_buckets/${bucketKey(slot)}`, {
        bookingId: "someone-else",
      });
    }
    const db = makeDb(docs);

    const res = await updateBookingSchedule(
      db,
      "b1",
      { startIso: target.toUTC().toISO()! },
      ACTOR,
      OPTS,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("slot_taken");
  });

  it("treats an admin hold on the target slot as blocked", async () => {
    const { docs } = seed();
    const target = futureStart(11);
    const slot = target;
    docs.set(`slot_buckets/${bucketKey(slot)}`, {
      holdId: "hold1",
    });
    const db = makeDb(docs);

    const res = await updateBookingSchedule(
      db,
      "b1",
      { startIso: target.toUTC().toISO()! },
      ACTOR,
      OPTS,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("slot_blocked");
  });

  it("does not treat the booking's own buckets as a conflict", async () => {
    const { docs } = seed();
    const target = futureStart(12);
    for (const offset of [0, 30]) {
      const slot = target.plus({ minutes: offset });
      docs.set(`slot_buckets/${bucketKey(slot)}`, {
        bookingId: "b1",
      });
    }
    const db = makeDb(docs);

    const res = await updateBookingSchedule(
      db,
      "b1",
      { startIso: target.toUTC().toISO()! },
      ACTOR,
      OPTS,
    );
    expect(res.ok).toBe(true);
  });

  it("refuses to move a cancelled booking", async () => {
    const { docs } = seed({ status: "cancelled" });
    const db = makeDb(docs);
    const res = await updateBookingSchedule(
      db,
      "b1",
      { startIso: futureStart(13).toUTC().toISO()! },
      ACTOR,
      OPTS,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("bad_status");
  });

  it("refuses a start time in the past", async () => {
    const { docs } = seed();
    const db = makeDb(docs);
    const past = DateTime.now()
      .setZone(TIME_ZONE)
      .minus({ days: 1 })
      .set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
    const res = await updateBookingSchedule(
      db,
      "b1",
      { startIso: past.toUTC().toISO()! },
      ACTOR,
      OPTS,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("invalid_time");
  });

  it("allows a provider swap on an appointment happening today", async () => {
    // Bounds are only enforced when the START moves, so a same-day swap works.
    const todayTen = DateTime.now()
      .setZone(TIME_ZONE)
      .set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
    const { docs } = seed({ startIso: todayTen.toUTC().toISO()! });
    const db = makeDb(docs);

    const res = await updateBookingSchedule(db, "b1", { providerId: "p2" }, ACTOR, OPTS);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.providerChanged).toBe(true);
    expect(res.changed).toBe(false);
  });

  it("returns not_found for a missing booking", async () => {
    const db = makeDb(new Map());
    const res = await updateBookingSchedule(db, "nope", { providerId: "p2" }, ACTOR, OPTS);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("not_found");
  });
});
