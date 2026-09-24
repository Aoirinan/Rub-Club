import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import {
  THERAPIST_HIDDEN_BOOKING_FIELDS,
  clampToTherapistWindow,
  therapistScheduleWindow,
  withoutTherapistHiddenFields,
} from "./therapist-schedule-window";

const zone = "America/Chicago";
// Wed Sep 23 2026, 9:30 PM Chicago = Thu 02:30 UTC: the Chicago day, not UTC, counts.
const now = DateTime.fromISO("2026-09-23T21:30:00", { zone }).toMillis();
const chicago = (iso: string) => DateTime.fromISO(iso, { zone }).toMillis();

describe("therapistScheduleWindow", () => {
  it("covers Chicago days from 7 days back through 7 days ahead", () => {
    const w = therapistScheduleWindow(now);
    expect(w.fromMs).toBe(chicago("2026-09-16T00:00:00"));
    expect(w.toMs).toBe(chicago("2026-10-01T00:00:00") - 1);
  });
});

describe("clampToTherapistWindow", () => {
  it("leaves the day and week views alone", () => {
    const day = clampToTherapistWindow(chicago("2026-09-22T23:00:00"), chicago("2026-09-24T01:00:00"), now);
    expect(day).toMatchObject({ clamped: false, empty: false });
    // Week of Mon Sep 21, as the scheduler asks for it (±1 hour).
    const week = clampToTherapistWindow(chicago("2026-09-20T23:00:00"), chicago("2026-09-28T01:00:00"), now);
    expect(week).toMatchObject({ clamped: false, empty: false });
  });

  it("cuts the 60-day list view and a wide reports range down to the window", () => {
    const w = therapistScheduleWindow(now);
    const list = clampToTherapistWindow(chicago("2026-09-22T00:00:00"), chicago("2026-11-22T00:00:00"), now);
    expect(list).toEqual({ fromMs: chicago("2026-09-22T00:00:00"), toMs: w.toMs, clamped: true, empty: false });
    const wide = clampToTherapistWindow(0, Number.MAX_SAFE_INTEGER, now);
    expect(wide).toEqual({ fromMs: w.fromMs, toMs: w.toMs, clamped: true, empty: false });
  });

  it("returns nothing for a range entirely outside the window", () => {
    expect(
      clampToTherapistWindow(chicago("2026-12-01T00:00:00"), chicago("2026-12-02T00:00:00"), now).empty,
    ).toBe(true);
    expect(
      clampToTherapistWindow(chicago("2026-01-01T00:00:00"), chicago("2026-01-02T00:00:00"), now).empty,
    ).toBe(true);
  });
});

describe("withoutTherapistHiddenFields", () => {
  it("drops staff notes and payment details and keeps the schedule", () => {
    const row = {
      id: "b1",
      name: "Pat",
      startAtMs: 1,
      notes: "hello",
      noShow: true,
      internalNotes: "staff only",
      paidAtMs: 2,
      paidAmountCents: 6500,
      paymentMethod: "cash",
      paymentNote: "n",
      paymentRecordedByEmail: "desk@example.com",
      squarePaymentId: "sq",
      paymentLinkUrl: "https://example.com",
      accepted: { uid: "u", email: "e", atIso: null, reason: null },
    };
    const out = withoutTherapistHiddenFields(row);
    for (const key of THERAPIST_HIDDEN_BOOKING_FIELDS) expect(key in out).toBe(false);
    expect(out).toEqual({ id: "b1", name: "Pat", startAtMs: 1, notes: "hello", noShow: true });
    // The input is not modified.
    expect(row.internalNotes).toBe("staff only");
  });
});
