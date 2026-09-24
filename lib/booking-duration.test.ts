import { describe, expect, it } from "vitest";
import {
  isValidBookingDurationMin,
  isValidCatalogDurationMin,
  isValidPublicBookingDurationMin,
} from "./booking-duration";
import { isValidAdminBookingDurationMin } from "./booking-reschedule";

describe("booking lengths", () => {
  it("grid lengths are 30-minute steps", () => {
    expect(isValidBookingDurationMin(30)).toBe(true);
    expect(isValidBookingDurationMin(90)).toBe(true);
    expect(isValidBookingDurationMin(45)).toBe(false);
  });

  it("catalog lengths match what admin create and reschedule accept", () => {
    for (const n of [15, 45, 50, 75, 480]) {
      expect(isValidCatalogDurationMin(n)).toBe(true);
      expect(isValidAdminBookingDurationMin(n)).toBe(true);
    }
    for (const n of [0, 10, 481, 45.5, Number.NaN]) {
      expect(isValidCatalogDurationMin(n)).toBe(false);
      expect(isValidAdminBookingDurationMin(n)).toBe(false);
    }
  });

  it("public booking takes a catalog service's own length, otherwise 30-minute steps", () => {
    expect(isValidPublicBookingDurationMin(45, 45)).toBe(true);
    expect(isValidPublicBookingDurationMin(60, 60)).toBe(true);
    // Must be that service's length.
    expect(isValidPublicBookingDurationMin(60, 45)).toBe(false);
    // Without a catalog service, grid lengths only.
    expect(isValidPublicBookingDurationMin(45)).toBe(false);
    expect(isValidPublicBookingDurationMin(45, null)).toBe(false);
    expect(isValidPublicBookingDurationMin(60)).toBe(true);
    // Still within the catalog range.
    expect(isValidPublicBookingDurationMin(600, 600)).toBe(false);
  });
});
