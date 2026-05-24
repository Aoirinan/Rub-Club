import { describe, expect, it } from "vitest";
import { BRANDI_WEEKLY_HOURS, dayHoursForDate, providerHoursContext, weekdayKeyFromDate } from "./provider-profile";
import { effectiveDayWindowFromHours, isWithinProviderHours } from "./slots-luxon";
import { DateTime } from "luxon";
import { TIME_ZONE } from "./constants";

describe("provider weekly hours", () => {
  it("Brandi is closed Tuesday", () => {
    const ctx = providerHoursContext({
      weeklyHours: BRANDI_WEEKLY_HOURS,
      schedule: null,
      displayName: "Brandi",
    });
    const mon = "2026-05-18";
    expect(weekdayKeyFromDate(mon)).toBe("mon");
    expect(dayHoursForDate(mon, ctx)?.open).toBe(true);
    const tue = "2026-05-19";
    expect(dayHoursForDate(tue, ctx)?.open).toBe(false);
    const w = effectiveDayWindowFromHours(tue, ctx);
    expect(w.close <= w.open).toBe(true);
  });

  it("respects open window on Wednesday morning", () => {
    const ctx = providerHoursContext({
      weeklyHours: BRANDI_WEEKLY_HOURS,
      schedule: null,
      displayName: "Brandi",
    });
    const wed = "2026-05-20";
    const start = DateTime.fromISO(`${wed}T09:30:00`, { zone: TIME_ZONE });
    expect(isWithinProviderHours(start, 30, ctx)).toBe(true);
    const late = DateTime.fromISO(`${wed}T13:00:00`, { zone: TIME_ZONE });
    expect(isWithinProviderHours(late, 30, ctx)).toBe(false);
  });
});
