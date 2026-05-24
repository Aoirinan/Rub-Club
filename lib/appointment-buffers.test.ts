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
    expect(starts.length).toBe(3);
    expect(starts[0].toFormat("HH:mm")).toBe("09:45");
    expect(starts[starts.length - 1].toFormat("HH:mm")).toBe("10:45");
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
