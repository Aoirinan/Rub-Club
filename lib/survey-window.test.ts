import { describe, expect, it } from "vitest";
import { surveyStartAtWindow, surveyTiming } from "./survey-window";

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const now = Date.UTC(2026, 8, 23, 18, 0, 0);

describe("surveyTiming", () => {
  it.each([30, 60, 90, 120])("surveys a %i-minute visit that ended an hour ago", (dur) => {
    expect(surveyTiming(now - 60 * MIN - dur * MIN, dur, now)).toBe("eligible");
  });

  it("waits until 20 minutes after the visit ends", () => {
    expect(surveyTiming(now - 120 * MIN - 19 * MIN, 120, now)).toBe("too_soon");
    expect(surveyTiming(now - 120 * MIN - 20 * MIN, 120, now)).toBe("eligible");
  });

  it("stops 7 days after the visit ends", () => {
    expect(surveyTiming(now - 7 * DAY - 90 * MIN, 90, now)).toBe("eligible");
    expect(surveyTiming(now - 7 * DAY - 91 * MIN, 90, now)).toBe("too_old");
  });

  it("rejects missing or impossible durations", () => {
    expect(surveyTiming(now - DAY, undefined, now)).toBe("bad_duration");
    expect(surveyTiming(now - DAY, "60", now)).toBe("bad_duration");
    expect(surveyTiming(now - DAY, 0, now)).toBe("bad_duration");
    expect(surveyTiming(now - DAY, 600, now)).toBe("bad_duration");
  });
});

describe("surveyStartAtWindow", () => {
  const { fromMs, beforeMs } = surveyStartAtWindow(now);
  const inQuery = (startMs: number) => startMs >= fromMs && startMs < beforeMs;

  it("contains every start time that can be eligible", () => {
    for (const dur of [15, 30, 60, 90, 120, 480]) {
      // Newest eligible start and oldest eligible start for this duration.
      const newest = now - 20 * MIN - dur * MIN;
      const oldest = now - 7 * DAY - dur * MIN;
      expect(surveyTiming(newest, dur, now)).toBe("eligible");
      expect(surveyTiming(oldest, dur, now)).toBe("eligible");
      expect(inQuery(newest)).toBe(true);
      expect(inQuery(oldest)).toBe(true);
    }
  });

  it("excludes visits that are too old for any duration", () => {
    expect(inQuery(now - 8 * DAY)).toBe(false);
    expect(inQuery(now)).toBe(false);
  });
});
