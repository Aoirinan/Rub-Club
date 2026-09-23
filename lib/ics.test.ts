import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { buildIcs, icsSequenceNow } from "./ics";

const base = {
  uid: "abc@chiropracticparistexas.com",
  startUtc: DateTime.fromISO("2026-10-01T15:00:00Z", { zone: "utc" }),
  durationMinutes: 60,
  summary: "Massage appointment",
  description: "Reference: abc.",
  location: "Paris, TX",
};

function line(ics: string, prop: string): string | undefined {
  return ics.split("\r\n").find((l) => l.startsWith(`${prop}:`));
}

describe("buildIcs", () => {
  it("marks confirmed visits CONFIRMED by default and pending ones TENTATIVE", () => {
    expect(line(buildIcs(base), "STATUS")).toBe("STATUS:CONFIRMED");
    expect(line(buildIcs({ ...base, status: "confirmed" }), "STATUS")).toBe("STATUS:CONFIRMED");
    expect(line(buildIcs({ ...base, status: "pending" }), "STATUS")).toBe("STATUS:TENTATIVE");
  });

  it("uses an explicit SEQUENCE when given", () => {
    expect(line(buildIcs({ ...base, sequence: 7 }), "SEQUENCE")).toBe("SEQUENCE:7");
  });

  it("defaults SEQUENCE to a value that grows over time", () => {
    const seq = Number(line(buildIcs(base), "SEQUENCE")?.split(":")[1]);
    expect(Number.isInteger(seq)).toBe(true);
    expect(seq).toBeGreaterThan(0);
    expect(icsSequenceNow(Date.UTC(2026, 9, 1, 12, 0, 1))).toBeGreaterThan(
      icsSequenceNow(Date.UTC(2026, 9, 1, 12, 0, 0)),
    );
    // Stays inside RFC 5545's signed 32-bit INTEGER for decades.
    expect(icsSequenceNow(Date.UTC(2090, 0, 1))).toBeLessThan(2 ** 31 - 1);
  });

  it("keeps the same UID so a regenerated invite replaces the old event", () => {
    const a = buildIcs({ ...base, sequence: 1 });
    const b = buildIcs({ ...base, startUtc: base.startUtc.plus({ days: 1 }), sequence: 2 });
    expect(line(a, "UID")).toBe(line(b, "UID"));
    expect(line(b, "DTSTART")).toBe("DTSTART:20261002T150000Z");
  });
});
