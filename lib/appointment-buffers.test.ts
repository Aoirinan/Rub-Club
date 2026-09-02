import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { TIME_ZONE } from "./constants";
import { blockedSlotStartsForAppointment, bufferOnlyIntervals } from "./appointment-buffers";

describe("appointment buffers", () => {
  it("extends blocked slots before and after", () => {
    const start = DateTime.fromISO("2026-05-20T10:00:00", { zone: TIME_ZONE });
    const starts = blockedSlotStartsForAppointment(start, {
      durationMinutes: 60,
      bufferBeforeMinutes: 15,
      bufferAfterMinutes: 15,
    });
    // 09:45–11:15 snapped to the 30-minute grid → 09:30, 10:00, 10:30, 11:00.
    expect(starts.length).toBe(4);
    expect(starts[0].toFormat("HH:mm")).toBe("09:30");
    expect(starts[starts.length - 1].toFormat("HH:mm")).toBe("11:00");
  });

  it("keeps grid-aligned buffers on the grid", () => {
    const start = DateTime.fromISO("2026-05-20T10:00:00", { zone: TIME_ZONE });
    const starts = blockedSlotStartsForAppointment(start, {
      durationMinutes: 60,
      bufferBeforeMinutes: 30,
      bufferAfterMinutes: 0,
    });
    expect(starts.map((s) => s.toFormat("HH:mm"))).toEqual(["09:30", "10:00", "10:30"]);
  });

  it("does not leave the tail of an off-grid duration bookable", () => {
    const start = DateTime.fromISO("2026-05-20T10:00:00", { zone: TIME_ZONE });
    const starts = blockedSlotStartsForAppointment(start, {
      durationMinutes: 40,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
    });
    expect(starts.map((s) => s.toFormat("HH:mm"))).toEqual(["10:00", "10:30"]);
  });

  it("returns buffer-only intervals for calendar", () => {
    const startMs = DateTime.fromISO("2026-05-20T10:00:00", { zone: TIME_ZONE }).toMillis();
    const ivs = bufferOnlyIntervals(startMs, {
      durationMinutes: 60,
      bufferBeforeMinutes: 15,
      bufferAfterMinutes: 30,
    });
    expect(ivs).toHaveLength(2);
    expect(ivs[0].endMs - ivs[0].startMs).toBe(15 * 60_000);
    expect(ivs[1].endMs - ivs[1].startMs).toBe(30 * 60_000);
  });
});
