import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { TIME_ZONE } from "./constants";
import {
  bookingMatchesExpected,
  rescheduleBookingForStartChange,
  updateBookingSchedule,
} from "./booking-reschedule";
import { listOpenStartsForExistingBooking } from "./booking-reschedule-slots";
import type { ProviderRow } from "./provider-types";

/**
 * Minimal in-memory stand-in for the Admin SDK surface these functions use:
 * doc get/set/update/delete, getAll, a providers `where("active","==",true)`
 * query and a transaction that applies writes only when the body resolves.
 * `beforeTx` runs just before the transaction body, to simulate someone else
 * saving in between the pre-read and the transaction.
 */
type Docs = Map<string, Record<string, unknown>>;

function makeDb(docs: Docs, hooks: { beforeTx?: () => void } = {}) {
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
    getAll: async (...refs: { __col: string; __id: string }[]) =>
      refs.map((r) => makeSnap(r.__col, r.__id)),
    runTransaction: async (fn: (tx: unknown) => Promise<void>) => {
      hooks.beforeTx?.();
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
  // Catalog services.
  docs.set("scheduler_services/massage60", {
    name: "Massage (60 min)",
    serviceLines: ["massage"],
    durationMinutes: 60,
  });
  docs.set("scheduler_services/hotstone60", {
    name: "Hot Stone",
    serviceLines: ["massage"],
    durationMinutes: 60,
  });
  docs.set("scheduler_services/massage60buffer", {
    name: "Massage + turnover",
    serviceLines: ["massage"],
    durationMinutes: 60,
    bufferAfterMinutes: 30,
  });
  docs.set("scheduler_services/chiro30", {
    name: "1/2 HR Dr",
    serviceLines: ["chiropractic"],
    durationMinutes: 30,
  });
  docs.set("scheduler_services/retired", {
    name: "Old promo",
    serviceLines: ["massage"],
    durationMinutes: 60,
    active: false,
  });
  return { docs, startIso };
}

function bookingUpdate(db: ReturnType<typeof makeDb>) {
  return db.__writes.find((w) => w.op === "update" && w.path === "bookings/b1");
}

function slotWrites(db: ReturnType<typeof makeDb>) {
  return db.__writes.filter((w) => w.path.startsWith("slot_buckets/"));
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

  it("accepts a 45-minute length (catalog steps by 15) and blocks every slot it touches", async () => {
    const { docs } = seed();
    const db = makeDb(docs);
    const res = await updateBookingSchedule(db, "b1", { durationMin: 45 }, ACTOR, OPTS);
    expect(res.ok).toBe(true);
    const update = bookingUpdate(db);
    expect(update!.data!.durationMin).toBe(45);
    // 10:00–10:45 touches the 10:00 and 10:30 slots.
    const start = futureStart();
    expect(update!.data!.bucketIds).toEqual([bucketKey(start), bucketKey(start.plus({ minutes: 30 }))]);
  });

  it("can still move a booking that already has an off-grid length", async () => {
    const { docs } = seed({ durationMin: 45 });
    const db = makeDb(docs);
    const res = await updateBookingSchedule(
      db,
      "b1",
      { startIso: futureStart(8).toUTC().toISO()! },
      ACTOR,
      OPTS,
    );
    expect(res.ok).toBe(true);
  });

  it("rejects a length outside 15–480 minutes", async () => {
    for (const durationMin of [10, 481]) {
      const { docs } = seed();
      const db = makeDb(docs);
      const res = await updateBookingSchedule(db, "b1", { durationMin }, ACTOR, OPTS);
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.code).toBe("invalid_duration");
    }
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

describe("updateBookingSchedule — concurrent edits", () => {
  it("refuses the save when someone else changed the booking after it was read", async () => {
    const { docs } = seed();
    const db = makeDb(docs, {
      // A colleague moves the visit to Sam between our pre-read and our transaction.
      beforeTx: () => {
        docs.set("bookings/b1", { ...docs.get("bookings/b1")!, providerId: "p2", providerDisplayName: "Sam" });
      },
    });
    const res = await updateBookingSchedule(
      db,
      "b1",
      { startIso: futureStart(8).toUTC().toISO()! },
      ACTOR,
      OPTS,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("stale");
    expect(res.status).toBe(409);
    // Nothing written: no buckets for the old provider, no reverted provider.
    expect(db.__writes.length).toBe(0);
  });

  it("refuses the save when the editor's snapshot no longer matches", async () => {
    const { docs, startIso } = seed();
    const db = makeDb(docs);
    const res = await updateBookingSchedule(db, "b1", { durationMin: 90 }, ACTOR, {
      ...OPTS,
      // The editor opened while the visit was still with Sam.
      expected: { startIso, providerId: "p2", durationMin: 60, serviceLine: "massage", schedulerServiceId: "" },
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("stale");
    expect(db.__writes.length).toBe(0);
  });

  it("saves when the editor's snapshot still matches", async () => {
    const { docs } = seed();
    const db = makeDb(docs);
    const start = futureStart();
    const res = await updateBookingSchedule(db, "b1", { durationMin: 90 }, ACTOR, {
      ...OPTS,
      // Same instant written with a Chicago offset instead of UTC.
      expected: {
        startIso: start.toISO()!,
        providerId: "p1",
        durationMin: 60,
        serviceLine: "massage",
        schedulerServiceId: "",
      },
    });
    expect(res.ok).toBe(true);
  });

  it("bookingMatchesExpected only compares the fields it is given", () => {
    const d = { providerId: " p1 ", durationMin: 60, serviceLine: "massage" };
    expect(bookingMatchesExpected(d, {})).toBe(true);
    expect(bookingMatchesExpected(d, { providerId: "p1" })).toBe(true);
    expect(bookingMatchesExpected(d, { schedulerServiceId: "" })).toBe(true);
    expect(bookingMatchesExpected(d, { durationMin: 90 })).toBe(false);
    expect(bookingMatchesExpected(d, { schedulerServiceId: "massage60" })).toBe(false);
  });
});

describe("updateBookingSchedule — catalog service", () => {
  it("rejects a service line change that keeps a service of the old line", async () => {
    const { docs } = seed({ schedulerServiceId: "massage60", serviceTypeName: "Massage (60 min)" });
    const db = makeDb(docs);
    const res = await updateBookingSchedule(db, "b1", { serviceLine: "stretch" }, ACTOR, OPTS);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("service_line_mismatch");
    expect(res.status).toBe(400);
  });

  it("allows the line change when the service is cleared with it", async () => {
    const { docs } = seed({ schedulerServiceId: "massage60", serviceTypeName: "Massage (60 min)" });
    const db = makeDb(docs);
    const res = await updateBookingSchedule(
      db,
      "b1",
      { serviceLine: "stretch", schedulerServiceId: "" },
      ACTOR,
      OPTS,
    );
    expect(res.ok).toBe(true);
    expect(bookingUpdate(db)!.data!.serviceLine).toBe("stretch");
  });

  it("rejects a newly chosen service from another service line", async () => {
    const { docs } = seed();
    const db = makeDb(docs);
    const res = await updateBookingSchedule(db, "b1", { schedulerServiceId: "chiro30" }, ACTOR, OPTS);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("service_line_mismatch");
  });

  it("rejects a newly chosen inactive service", async () => {
    const { docs } = seed();
    const db = makeDb(docs);
    const res = await updateBookingSchedule(db, "b1", { schedulerServiceId: "retired" }, ACTOR, OPTS);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("inactive_service");
  });

  it("a new service's buffers extend the slots the visit holds", async () => {
    const { docs } = seed();
    const db = makeDb(docs);
    const res = await updateBookingSchedule(
      db,
      "b1",
      { schedulerServiceId: "massage60buffer" },
      ACTOR,
      OPTS,
    );
    expect(res.ok).toBe(true);
    const start = futureStart();
    expect(bookingUpdate(db)!.data!.bucketIds).toEqual([
      bucketKey(start),
      bucketKey(start.plus({ minutes: 30 })),
      bucketKey(start.plus({ minutes: 60 })),
    ]);
  });

  it("relabelling the service (same time, length, buffers) leaves slot buckets alone", async () => {
    // Booked with "allow double-booking": owns no buckets, and its slot is now
    // held by another visit and an admin hold.
    const { docs } = seed({ schedulerServiceId: "massage60", serviceTypeName: "Massage (60 min)" });
    const start = futureStart();
    const day = start.toFormat("yyyy-LL-dd");
    docs.set(`slot_buckets/${bucketKey(start)}`, { bookingId: "someone-else" });
    docs.set(`slot_buckets/paris__hold__all__${day}__${start.toFormat("HHmm")}`, { holdId: "hold1" });
    const db = makeDb(docs);

    const res = await updateBookingSchedule(db, "b1", { schedulerServiceId: "hotstone60" }, ACTOR, OPTS);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.changed).toBe(false);
    expect(slotWrites(db)).toEqual([]);
    expect(Object.keys(bookingUpdate(db)!.data!).sort()).toEqual([
      "bufferAfterMinutes",
      "bufferBeforeMinutes",
      "schedulerServiceId",
      "serviceTypeName",
    ]);
    expect(bookingUpdate(db)!.data!.serviceTypeName).toBe("Hot Stone");
  });
});

describe("updateBookingSchedule — patient portal", () => {
  const PATIENT = { uid: null, email: "patient/portal" };
  const PATIENT_OPTS = { allowPending: false, refuseIfStarted: true };

  it("refuses once the appointment has started", async () => {
    const started = DateTime.now().setZone(TIME_ZONE).minus({ minutes: 5 });
    const { docs } = seed({ startIso: started.toUTC().toISO()! });
    const db = makeDb(docs);
    const newIso = futureStart(8).toUTC().toISO()!;
    const res = await rescheduleBookingForStartChange(db, "b1", newIso, PATIENT, PATIENT_OPTS);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("already_started");
    expect(db.__writes.length).toBe(0);
  });

  it("still moves an upcoming appointment without an editor snapshot", async () => {
    const { docs } = seed();
    const db = makeDb(docs);
    const newIso = futureStart(8).toUTC().toISO()!;
    const res = await rescheduleBookingForStartChange(db, "b1", newIso, PATIENT, PATIENT_OPTS);
    expect(res.ok).toBe(true);
  });
});

describe("listOpenStartsForExistingBooking", () => {
  const provider: ProviderRow = {
    id: "p1",
    displayName: "Alex",
    active: true,
    locationIds: ["paris"],
    serviceLines: ["massage"],
    sortOrder: 0,
    acceptsNewClients: true,
  };

  function list(docs: Docs, date: DateTime, buffers = { before: 0, after: 0 }) {
    return listOpenStartsForExistingBooking(makeDb(docs), {
      bookingId: "b1",
      locationId: "paris",
      provider,
      serviceLine: "massage",
      durationMin: 60,
      bufferBeforeMinutes: buffers.before,
      bufferAfterMinutes: buffers.after,
      date: date.toFormat("yyyy-LL-dd"),
    });
  }

  const hhmm = (slots: { startIso: string }[]) =>
    slots.map((s) => DateTime.fromISO(s.startIso).setZone(TIME_ZONE).toFormat("HH:mm"));

  it("applies the visit's buffers, like the save does", async () => {
    const { docs } = seed();
    const day = futureStart(7);
    docs.set(`slot_buckets/${bucketKey(day.set({ hour: 11 }))}`, { bookingId: "someone-else" });

    const plain = hhmm(await list(docs, day));
    expect(plain).toContain("10:00");
    expect(plain).not.toContain("10:30");

    // 30 minutes of turnover after the visit: 10:00–11:00 now needs 11:00 too.
    const buffered = hhmm(await list(docs, day, { before: 0, after: 30 }));
    expect(buffered).toContain("09:30");
    expect(buffered).not.toContain("10:00");
  });

  it("offers the booking's own slots and skips admin holds", async () => {
    const { docs } = seed();
    const day = futureStart(7);
    docs.set(`slot_buckets/${bucketKey(day)}`, { bookingId: "b1" });
    const at14 = day.set({ hour: 14 });
    docs.set(`slot_buckets/paris__hold__massage__${at14.toFormat("yyyy-LL-dd")}__1400`, { holdId: "h1" });

    const times = hhmm(await list(docs, day));
    expect(times).toContain("10:00");
    expect(times).not.toContain("14:00");
    expect(times).not.toContain("13:30");
  });

  it("offers nothing past the 90-day horizon", async () => {
    const { docs } = seed();
    expect(await list(docs, futureStart(95))).toEqual([]);
  });
});
