import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { TIME_ZONE } from "./constants";
import { bucketDocIdsForAppointment, otherOfficeBucketIdsForAppointment } from "./slots-luxon";

describe("otherOfficeBucketIdsForAppointment", () => {
  const start = DateTime.fromISO("2026-10-05T10:00:00", { zone: TIME_ZONE });

  it("is empty for a provider listed at one office", () => {
    expect(
      otherOfficeBucketIdsForAppointment("paris", { id: "p1", locationIds: ["paris"] }, start, 60),
    ).toEqual([]);
    expect(otherOfficeBucketIdsForAppointment("paris", { id: "p1" }, start, 60)).toEqual([]);
  });

  it("gives the other office's ids for the same provider and time", () => {
    const ids = otherOfficeBucketIdsForAppointment(
      "paris",
      { id: "p1", locationIds: ["paris", "sulphur_springs"] },
      start,
      60,
    );
    expect(ids).toEqual([
      "sulphur_springs__p1__2026-10-05__1000",
      "sulphur_springs__p1__2026-10-05__1030",
    ]);
    // Existing per-office ids are unchanged.
    expect(bucketDocIdsForAppointment("paris", "p1", start, 60)).toEqual([
      "paris__p1__2026-10-05__1000",
      "paris__p1__2026-10-05__1030",
    ]);
  });

  it("works from either office and applies the same buffers", () => {
    const ids = otherOfficeBucketIdsForAppointment(
      "sulphur_springs",
      { id: "p1", locationIds: ["sulphur_springs", "paris", "paris"] },
      start,
      45,
      { bufferBeforeMinutes: 0, bufferAfterMinutes: 30 },
    );
    // 10:00–10:45 plus 30 minutes of turnover touches 10:00, 10:30 and 11:00.
    expect(ids).toEqual([
      "paris__p1__2026-10-05__1000",
      "paris__p1__2026-10-05__1030",
      "paris__p1__2026-10-05__1100",
    ]);
  });

  it("ignores unknown office ids", () => {
    expect(
      otherOfficeBucketIdsForAppointment("paris", { id: "p1", locationIds: ["paris", "dallas"] }, start, 30),
    ).toEqual([]);
  });
});
