import { describe, expect, it } from "vitest";
import { BRAND_LOGOS, resolveChiroHeaderLogo } from "@/lib/brand-logos";

describe("resolveChiroHeaderLogo", () => {
  it("defaults to the wide header lockup", () => {
    expect(resolveChiroHeaderLogo()).toBe(BRAND_LOGOS.chiropractic);
    expect(resolveChiroHeaderLogo("")).toBe(BRAND_LOGOS.chiropractic);
  });

  it("rewrites the circular source path to the wide asset", () => {
    expect(resolveChiroHeaderLogo(BRAND_LOGOS.chiropracticSource)).toBe(
      BRAND_LOGOS.chiropractic,
    );
    expect(resolveChiroHeaderLogo("/logos/chiropractic-associates.png")).toBe(
      BRAND_LOGOS.chiropractic,
    );
  });

  it("keeps custom CMS uploads", () => {
    const custom = "https://cdn.example.com/custom-chiro.png";
    expect(resolveChiroHeaderLogo(custom)).toBe(custom);
  });
});
