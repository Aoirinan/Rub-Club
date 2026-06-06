import { describe, expect, it } from "vitest";
import {
  DEFAULT_HEADER_COLORS,
  DEFAULT_PARIS_HEADER_COLORS,
  DEFAULT_SULPHUR_HEADER_COLORS,
  headerColorsForBusinessContext,
  headerColorsForVariant,
  isValidHexColor,
  mergeHeaderColors,
  validateHeaderColorConfig,
} from "./header-colors";

describe("header-colors", () => {
  it("validates hex colors", () => {
    expect(isValidHexColor("#fff")).toBe(true);
    expect(isValidHexColor("#ffffff")).toBe(true);
    expect(isValidHexColor("#C0392B")).toBe(true);
    expect(isValidHexColor("c0392b")).toBe(false);
    expect(isValidHexColor("#gggggg")).toBe(false);
    expect(isValidHexColor("")).toBe(false);
  });

  it("merges partial config with defaults", () => {
    const merged = mergeHeaderColors({
      paris: { navBg: "#ff0000" },
    });
    expect(merged.paris.navBg).toBe("#ff0000");
    expect(merged.paris.phoneBarBg).toBe(DEFAULT_PARIS_HEADER_COLORS.phoneBarBg);
    expect(merged.sulphurSprings).toEqual(DEFAULT_SULPHUR_HEADER_COLORS);
  });

  it("falls back to defaults for invalid partial values", () => {
    const merged = mergeHeaderColors({
      paris: { navBg: "not-a-color", logoRowBg: "#abc" },
    });
    expect(merged.paris.navBg).toBe(DEFAULT_PARIS_HEADER_COLORS.navBg);
    expect(merged.paris.logoRowBg).toBe("#abc");
  });

  it("maps brand variants to the correct palette", () => {
    const custom = mergeHeaderColors({
      paris: { navBg: "#111111" },
      sulphurSprings: { navBg: "#222222" },
    });
    expect(headerColorsForVariant("home", custom).navBg).toBe("#111111");
    expect(headerColorsForVariant("massage", custom).navBg).toBe("#111111");
    expect(headerColorsForVariant("chiropractic", custom).navBg).toBe("#111111");
    expect(headerColorsForVariant("sulphur-springs", custom).navBg).toBe("#222222");
  });

  it("maps business context to the correct palette", () => {
    const custom = mergeHeaderColors({
      paris: { navBg: "#111111" },
      sulphurSprings: { navBg: "#222222" },
    });
    expect(headerColorsForBusinessContext("default", custom).navBg).toBe("#111111");
    expect(headerColorsForBusinessContext("paris_chiro", custom).navBg).toBe("#111111");
    expect(headerColorsForBusinessContext("sulphur_springs", custom).navBg).toBe("#222222");
  });

  it("uses built-in defaults when config is omitted", () => {
    expect(headerColorsForVariant("sulphur-springs")).toEqual(DEFAULT_HEADER_COLORS.sulphurSprings);
    expect(headerColorsForVariant("massage")).toEqual(DEFAULT_HEADER_COLORS.paris);
  });

  it("rejects invalid config on validate", () => {
    const invalid = mergeHeaderColors({});
    invalid.paris.navBg = "bad";
    expect(validateHeaderColorConfig(invalid)).toEqual({
      ok: false,
      error: "Invalid hex color for paris.navBg: bad",
    });
    expect(validateHeaderColorConfig(DEFAULT_HEADER_COLORS)).toEqual({ ok: true });
  });
});
