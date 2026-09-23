import { describe, expect, it } from "vitest";
import {
  officeSeriesLines,
  patientSeriesNote,
  seriesCadenceLabel,
  skippedDatesLine,
} from "./booking-series-notes";

describe("seriesCadenceLabel", () => {
  it("names biweekly series correctly", () => {
    expect(seriesCadenceLabel("weekly")).toBe("weekly");
    expect(seriesCadenceLabel("biweekly")).toBe("every-other-week");
  });
});

describe("patientSeriesNote", () => {
  it("lists the other booked visits with the right cadence", () => {
    const note = patientSeriesNote({
      frequency: "biweekly",
      bookedIds: ["a", "b", "c"],
      skippedLabels: [],
    });
    expect(note).toBe(
      "We also received 2 additional every-other-week visit(s) on the same weekday. Each is pending office confirmation (references: b, c).",
    );
  });

  it("adds one line for skipped dates", () => {
    const note = patientSeriesNote({
      frequency: "weekly",
      bookedIds: ["b", "c"],
      skippedLabels: ["Oct 6"],
    });
    expect(note).toContain("1 additional weekly visit(s)");
    expect(note).toContain("(references: c)");
    expect(note).toContain("could not be booked because the time was already taken: Oct 6.");
  });

  it("mentions skipped dates even when only one visit was booked", () => {
    expect(
      patientSeriesNote({ frequency: "weekly", bookedIds: ["c"], skippedLabels: ["Oct 6", "Oct 13"] }),
    ).toBe("These dates could not be booked because the time was already taken: Oct 6, Oct 13.");
  });

  it("returns undefined for a single visit with nothing skipped", () => {
    expect(patientSeriesNote({ frequency: "weekly", bookedIds: ["a"], skippedLabels: [] })).toBeUndefined();
  });
});

describe("officeSeriesLines", () => {
  it("reports requested count, cadence, booked IDs and skipped dates", () => {
    expect(
      officeSeriesLines({
        frequency: "biweekly",
        requestedCount: 3,
        bookedIds: ["b", "c"],
        skippedLabels: ["Oct 6"],
      }),
    ).toEqual([
      "Patient requested 3 recurring every-other-week visits (same weekday).",
      "Booking IDs: b, c",
      "These dates could not be booked because the time was already taken: Oct 6.",
    ]);
  });

  it("omits the skipped line when nothing was skipped", () => {
    expect(
      officeSeriesLines({ frequency: "weekly", requestedCount: 2, bookedIds: ["a", "b"], skippedLabels: [] }),
    ).toHaveLength(2);
    expect(skippedDatesLine([])).toBeUndefined();
  });
});
