import { describe, expect, it } from "vitest";
import {
  DEFAULT_HEADER_LOGO_HEIGHTS,
  headerLogoHeightsFromValues,
  headerLogoHeightPx,
  parseHeaderLogoHeightPx,
} from "@/lib/header-logo-sizes";

describe("parseHeaderLogoHeightPx", () => {
  it("returns fallback for empty or invalid input", () => {
    expect(parseHeaderLogoHeightPx("", 96)).toBe(96);
    expect(parseHeaderLogoHeightPx("abc", 80)).toBe(80);
  });

  it("clamps to safe bounds", () => {
    expect(parseHeaderLogoHeightPx("10", 96)).toBe(24);
    expect(parseHeaderLogoHeightPx("999", 96)).toBe(160);
  });

  it("parses valid integers", () => {
    expect(parseHeaderLogoHeightPx("120", 96)).toBe(120);
  });
});

describe("headerLogoHeightsFromValues", () => {
  it("derives compact nav height as 70% of nav", () => {
    const h = headerLogoHeightsFromValues(100, 60);
    expect(h.nav).toBe(100);
    expect(h.navCompact).toBe(70);
    expect(h.mobile).toBe(60);
  });
});

describe("headerLogoHeightPx", () => {
  it("uses Paris defaults bumped ~20% for desktop nav", () => {
    expect(DEFAULT_HEADER_LOGO_HEIGHTS.chiro.nav).toBe(96);
    expect(headerLogoHeightPx(DEFAULT_HEADER_LOGO_HEIGHTS.chiro, "side")).toBe(40);
  });
});
