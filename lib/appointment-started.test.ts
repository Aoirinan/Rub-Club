import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { appointmentHasStarted } from "./appointment-started";

describe("appointmentHasStarted", () => {
  const now = DateTime.fromISO("2026-09-23T15:00:00Z");

  it("is false before the start and true from the start on", () => {
    expect(appointmentHasStarted("2026-09-23T15:30:00.000Z", now)).toBe(false);
    expect(appointmentHasStarted("2026-09-23T15:00:00.000Z", now)).toBe(true);
    expect(appointmentHasStarted("2026-09-23T14:00:00.000Z", now)).toBe(true);
  });

  it("compares instants, whatever the offset", () => {
    // 10:30 Chicago (CDT) is 15:30 UTC.
    expect(appointmentHasStarted("2026-09-23T10:30:00-05:00", now)).toBe(false);
  });

  it("treats a missing or unreadable start as not started", () => {
    expect(appointmentHasStarted(undefined, now)).toBe(false);
    expect(appointmentHasStarted("", now)).toBe(false);
    expect(appointmentHasStarted("not a date", now)).toBe(false);
  });
});
