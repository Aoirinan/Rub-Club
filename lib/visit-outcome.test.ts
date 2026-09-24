import { describe, expect, it } from "vitest";
import { countsAsNoShow, noShowRefusal } from "./visit-outcome";

const now = Date.UTC(2026, 8, 23, 18, 0, 0);
const past = now - 60 * 60 * 1000;
const future = now + 60 * 60 * 1000;

describe("countsAsNoShow", () => {
  it("counts an explicit no-show", () => {
    expect(countsAsNoShow({ status: "confirmed", startAtMs: past, checkedIn: false, noShow: true }, now)).toBe(true);
  });

  it("keeps the old inference for past confirmed visits with neither mark", () => {
    expect(countsAsNoShow({ status: "confirmed", startAtMs: past, checkedIn: false }, now)).toBe(true);
    expect(countsAsNoShow({ status: "confirmed", startAtMs: future, checkedIn: false }, now)).toBe(false);
    expect(countsAsNoShow({ status: "pending", startAtMs: past, checkedIn: false }, now)).toBe(false);
  });

  it("never counts a checked-in visit", () => {
    expect(countsAsNoShow({ status: "confirmed", startAtMs: past, checkedIn: true }, now)).toBe(false);
    expect(countsAsNoShow({ status: "confirmed", startAtMs: past, checkedIn: true, noShow: true }, now)).toBe(false);
  });

  it("never counts cancelled or declined visits", () => {
    for (const status of ["cancelled", "declined"]) {
      expect(countsAsNoShow({ status, startAtMs: past, checkedIn: false, noShow: true }, now)).toBe(false);
    }
  });
});

describe("noShowRefusal", () => {
  it("allows a confirmed visit whose start has passed", () => {
    expect(noShowRefusal({ status: "confirmed", startAtMs: past }, now)).toBeNull();
    expect(noShowRefusal({ status: "confirmed", startAtMs: now }, now)).toBeNull();
  });

  it("refuses future visits and other statuses", () => {
    expect(noShowRefusal({ status: "confirmed", startAtMs: future }, now)).toMatch(/start time/);
    expect(noShowRefusal({ status: "confirmed", startAtMs: null }, now)).toMatch(/start time/);
    expect(noShowRefusal({ status: "pending", startAtMs: past }, now)).toMatch(/confirmed/);
    expect(noShowRefusal({ status: "cancelled", startAtMs: past }, now)).toMatch(/confirmed/);
  });
});
