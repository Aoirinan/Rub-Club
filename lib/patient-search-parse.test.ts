import { describe, expect, it } from "vitest";
import {
  committedPatientSearchFromRaw,
  nameSearchVariants,
  parsePatientLookupSearchParams,
} from "./patient-search-parse";

describe("parsePatientLookupSearchParams", () => {
  it("prefers non-empty q over phone", () => {
    expect(parsePatientLookupSearchParams("Smith", "9035550100")).toEqual({
      ok: true,
      mode: "name",
      name: "Smith",
    });
  });

  it("uses phone param when q empty", () => {
    expect(parsePatientLookupSearchParams("", "903-555-0100")).toEqual({
      ok: true,
      mode: "phone",
      digits: "9035550100",
    });
  });

  it("phone wins when single field has 7+ digits", () => {
    expect(parsePatientLookupSearchParams("9035550100", null)).toEqual({
      ok: true,
      mode: "phone",
      digits: "9035550100",
    });
  });

  it("name mode for 2+ letters without 7 digits", () => {
    expect(parsePatientLookupSearchParams("Jo", null)).toEqual({ ok: true, mode: "name", name: "Jo" });
  });

  it("rejects too-short input", () => {
    expect(parsePatientLookupSearchParams("J", null).ok).toBe(false);
    expect(parsePatientLookupSearchParams("", "12345").ok).toBe(false);
  });
});

describe("committedPatientSearchFromRaw", () => {
  it("matches API rules for the patient page", () => {
    expect(committedPatientSearchFromRaw("  ")).toBe("");
    expect(committedPatientSearchFromRaw("J")).toBe("");
    expect(committedPatientSearchFromRaw("Jo")).toBe("Jo");
    expect(committedPatientSearchFromRaw("(903) 555-0100")).toBe("(903) 555-0100");
    expect(committedPatientSearchFromRaw("12345")).toBe("");
    expect(committedPatientSearchFromRaw("903-55")).toBe("");
  });
});

describe("nameSearchVariants", () => {
  it("returns deduped case variants", () => {
    const v = nameSearchVariants("smith");
    expect(v).toContain("smith");
    expect(v).toContain("Smith");
    expect(v).toContain("SMITH");
  });

  it("returns empty for short input", () => {
    expect(nameSearchVariants("a")).toEqual([]);
  });
});
