import { describe, expect, it } from "vitest";
import {
  BRANDI_WEEKLY_HOURS,
  dayHoursForDate,
  dayHoursRanges,
  parseWeeklyHours,
  providerHoursContext,
  weekdayKeyFromDate,
  type ProviderWeeklyHours,
} from "./provider-profile";
import {
  dayEnvelopeFromHours,
  effectiveDayWindowsFromHours,
  enumerateCandidateStartsInWindows,
  isWithinProviderHours,
} from "./slots-luxon";
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
    expect(effectiveDayWindowsFromHours(tue, ctx)).toHaveLength(0);
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

describe("split-shift weekly hours", () => {
  // Sulphur Springs Monday: 8:00-13:00, then 14:00-17:00 after the lunch break.
  const SPLIT_MONDAY: ProviderWeeklyHours = {
    mon: {
      open: true,
      openHour: 8,
      openMinute: 0,
      closeHour: 13,
      closeMinute: 0,
      ranges: [
        { openHour: 8, openMinute: 0, closeHour: 13, closeMinute: 0 },
        { openHour: 14, openMinute: 0, closeHour: 17, closeMinute: 0 },
      ],
    },
  };

  const ctx = providerHoursContext({
    weeklyHours: SPLIT_MONDAY,
    schedule: null,
    displayName: "Conner Collins",
  });
  const mon = "2026-05-18";
  const at = (time: string) => DateTime.fromISO(`${mon}T${time}:00`, { zone: TIME_ZONE });

  it("exposes both windows for the day", () => {
    const windows = effectiveDayWindowsFromHours(mon, ctx);
    expect(windows).toHaveLength(2);
    expect(windows[0]!.open.hour).toBe(8);
    expect(windows[0]!.close.hour).toBe(13);
    expect(windows[1]!.open.hour).toBe(14);
    expect(windows[1]!.close.hour).toBe(17);
  });

  it("books inside either window", () => {
    expect(isWithinProviderHours(at("08:00"), 30, ctx)).toBe(true);
    expect(isWithinProviderHours(at("12:30"), 30, ctx)).toBe(true);
    expect(isWithinProviderHours(at("14:00"), 60, ctx)).toBe(true);
    expect(isWithinProviderHours(at("16:00"), 60, ctx)).toBe(true);
  });

  it("rejects appointments inside the midday break", () => {
    expect(isWithinProviderHours(at("13:00"), 30, ctx)).toBe(false);
    expect(isWithinProviderHours(at("13:30"), 30, ctx)).toBe(false);
  });

  it("rejects a 60-minute appointment that would straddle the break", () => {
    expect(isWithinProviderHours(at("12:30"), 60, ctx)).toBe(false);
    expect(isWithinProviderHours(at("12:00"), 90, ctx)).toBe(false);
  });

  it("rejects an appointment running past the final close", () => {
    expect(isWithinProviderHours(at("16:30"), 60, ctx)).toBe(false);
  });

  it("omits break-time starts from the candidate list", () => {
    const windows = effectiveDayWindowsFromHours(mon, ctx);
    const starts = enumerateCandidateStartsInWindows(mon, 60, windows).map((t) =>
      t.toFormat("HH:mm"),
    );
    expect(starts).toContain("08:00");
    expect(starts).toContain("11:30");
    expect(starts).not.toContain("12:30");
    expect(starts).not.toContain("13:00");
    expect(starts).not.toContain("13:30");
    expect(starts).toContain("14:00");
    expect(starts).toContain("16:00");
    expect(starts).not.toContain("16:30");
    expect(starts).toEqual([...starts].sort());
  });

  it("spans the break only for the whole-day envelope", () => {
    const envelope = dayEnvelopeFromHours(mon, ctx);
    expect(envelope.open.hour).toBe(8);
    expect(envelope.close.hour).toBe(17);
  });
});

describe("weekly hours parsing", () => {
  it("treats a document without ranges as one window", () => {
    const parsed = parseWeeklyHours({
      mon: { open: true, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
    });
    expect(dayHoursRanges(parsed?.mon)).toEqual([
      { openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
    ]);
  });

  it("round-trips ranges and mirrors the first onto the legacy fields", () => {
    const parsed = parseWeeklyHours({
      fri: {
        open: true,
        openHour: 0,
        openMinute: 0,
        closeHour: 0,
        closeMinute: 0,
        ranges: [
          { openHour: 14, openMinute: 0, closeHour: 18, closeMinute: 0 },
          { openHour: 9, openMinute: 0, closeHour: 13, closeMinute: 0 },
        ],
      },
    });
    expect(parsed?.fri?.openHour).toBe(14);
    expect(parsed?.fri?.closeHour).toBe(18);
    // dayHoursRanges sorts, so order in the document does not matter.
    expect(dayHoursRanges(parsed?.fri)).toEqual([
      { openHour: 9, openMinute: 0, closeHour: 13, closeMinute: 0 },
      { openHour: 14, openMinute: 0, closeHour: 18, closeMinute: 0 },
    ]);
  });

  it("merges overlapping ranges so a slot is never offered twice", () => {
    expect(
      dayHoursRanges({
        open: true,
        openHour: 9,
        openMinute: 0,
        closeHour: 13,
        closeMinute: 0,
        ranges: [
          { openHour: 9, openMinute: 0, closeHour: 13, closeMinute: 0 },
          { openHour: 12, openMinute: 0, closeHour: 17, closeMinute: 0 },
        ],
      }),
    ).toEqual([{ openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 }]);
  });

  it("keeps a closed day closed rather than falling back to default hours", () => {
    const parsed = parseWeeklyHours({
      sun: { open: false, openHour: 9, openMinute: 0, closeHour: 9, closeMinute: 0 },
    });
    expect(parsed?.sun?.open).toBe(false);
    expect(parsed?.sun?.openHour).toBe(9);
    expect(dayHoursRanges(parsed?.sun)).toEqual([]);
  });
});
