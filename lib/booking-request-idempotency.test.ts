import { describe, expect, it } from "vitest";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import {
  BOOKING_REQUEST_TTL_HOURS,
  bookingRequestFingerprint,
  isValidBookingRequestId,
  readBookingRequestInTx,
  replayFromBookingRequest,
  writeBookingRequestInTx,
} from "./booking-request-idempotency";

const BASE = {
  locationId: "paris",
  serviceLine: "massage",
  durationMin: 60,
  schedulerServiceId: "svc1",
  startIso: "2026-10-05T15:00:00.000Z",
  email: "Pat@Example.com",
  providerMode: "specific",
  providerId: "p1",
};

/** Just enough of a transaction: one stored doc, and the set() calls made. */
function fakeTx(stored: Record<string, unknown> | undefined) {
  const sets: { data: Record<string, unknown>; options: unknown }[] = [];
  const tx = {
    get: async () => ({
      exists: stored !== undefined,
      get: (field: string) => stored?.[field],
    }),
    set: (_ref: unknown, data: Record<string, unknown>, options: unknown) => {
      sets.push({ data, options });
    },
  };
  return { tx: tx as unknown as Transaction, sets };
}
const REF = {} as DocumentReference;

describe("isValidBookingRequestId", () => {
  it("accepts UUIDs and long hex ids only", () => {
    expect(isValidBookingRequestId("3f2a9c1e-8b4d-4e2f-9a6b-1c2d3e4f5a6b")).toBe(true);
    expect(isValidBookingRequestId("0123456789abcdef0123456789abcdef")).toBe(true);
    expect(isValidBookingRequestId("short")).toBe(false);
    expect(isValidBookingRequestId("has/slash/0123456789")).toBe(false);
    expect(isValidBookingRequestId("x".repeat(81))).toBe(false);
    expect(isValidBookingRequestId(undefined)).toBe(false);
  });
});

describe("bookingRequestFingerprint", () => {
  it("is stable for the same booking, ignoring email case and spacing", () => {
    expect(bookingRequestFingerprint(BASE)).toBe(
      bookingRequestFingerprint({ ...BASE, email: " pat@example.com " }),
    );
  });

  it("changes with the time, patient, provider or series", () => {
    const base = bookingRequestFingerprint(BASE);
    expect(bookingRequestFingerprint({ ...BASE, startIso: "2026-10-05T15:30:00.000Z" })).not.toBe(base);
    expect(bookingRequestFingerprint({ ...BASE, email: "other@example.com" })).not.toBe(base);
    expect(bookingRequestFingerprint({ ...BASE, providerId: "p2" })).not.toBe(base);
    expect(
      bookingRequestFingerprint({ ...BASE, recurrence: { frequency: "weekly", count: 3 } }),
    ).not.toBe(base);
  });
});

describe("replayFromBookingRequest", () => {
  const fp = bookingRequestFingerprint(BASE);

  it("has nothing to replay for a new id", () => {
    expect(replayFromBookingRequest(undefined, fp)).toEqual({ kind: "none" });
  });

  it("refuses an id reused for a different booking", () => {
    expect(
      replayFromBookingRequest({ fingerprint: "other", bookingIds: ["b1"] }, fp),
    ).toEqual({ kind: "mismatch" });
  });

  it("returns the saved response exactly", () => {
    const response = { ok: true, bookingId: "b1", bookingIds: ["b1"], totalCreated: 1, paymentUrl: "https://x" };
    expect(replayFromBookingRequest({ fingerprint: fp, bookingIds: ["b1"], response }, fp)).toEqual({
      kind: "replay",
      body: response,
    });
  });

  it("rebuilds a success response while the first submit is still finishing", () => {
    const res = replayFromBookingRequest(
      {
        fingerprint: fp,
        bookingIds: ["b1", "b2"],
        providerId: "p1",
        providerDisplayName: "Alex",
        providerMode: "specific",
      },
      fp,
    );
    expect(res).toEqual({
      kind: "replay",
      body: {
        ok: true,
        bookingId: "b1",
        bookingIds: ["b1", "b2"],
        status: "pending",
        providerId: "p1",
        providerDisplayName: "Alex",
        providerMode: "specific",
        totalCreated: 2,
      },
    });
  });
});

describe("booking request record in the booking transaction", () => {
  it("lets a new id through and records the visit with an expiry", async () => {
    const { tx, sets } = fakeTx(undefined);
    const read = await readBookingRequestInTx(tx, REF, "attempt-1");
    expect(read).toEqual({ exists: false });
    writeBookingRequestInTx(tx, REF, {
      exists: read.exists,
      attempt: "attempt-1",
      fingerprint: "fp",
      bookingId: "b1",
      providerId: "p1",
      providerDisplayName: "Alex",
      providerMode: "specific",
      nowMs: 1_000,
    });
    expect(sets).toHaveLength(1);
    expect(sets[0]!.options).toEqual({ merge: true });
    expect(sets[0]!.data.attempt).toBe("attempt-1");
    expect(sets[0]!.data.fingerprint).toBe("fp");
    const expiresAt = sets[0]!.data.expiresAt as { toMillis: () => number };
    expect(expiresAt.toMillis()).toBe(1_000 + BOOKING_REQUEST_TTL_HOURS * 3_600_000);
  });

  it("lets later visits of the same submit through without resetting the expiry", async () => {
    const { tx, sets } = fakeTx({ attempt: "attempt-1", bookingIds: ["b1"] });
    const read = await readBookingRequestInTx(tx, REF, "attempt-1");
    expect(read).toEqual({ exists: true });
    writeBookingRequestInTx(tx, REF, {
      exists: read.exists,
      attempt: "attempt-1",
      fingerprint: "fp",
      bookingId: "b2",
      providerId: "p1",
      providerDisplayName: "Alex",
      providerMode: "specific",
    });
    expect(sets[0]!.data.expiresAt).toBeUndefined();
    expect(sets[0]!.data.createdAt).toBeUndefined();
  });

  it("stops a second submit with the same id from booking again", async () => {
    const { tx } = fakeTx({ attempt: "attempt-1", bookingIds: ["b1"] });
    await expect(readBookingRequestInTx(tx, REF, "attempt-2")).rejects.toThrow("duplicate_request");
  });
});
