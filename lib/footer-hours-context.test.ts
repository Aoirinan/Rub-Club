import { describe, expect, it } from "vitest";
import {
  footerHoursFocus,
  footerHoursFocusFromPathname,
} from "@/lib/footer-hours-context";

describe("footerHoursFocusFromPathname", () => {
  it("returns paris for massage and paris location paths", () => {
    expect(footerHoursFocusFromPathname("/services/massage")).toBe("paris");
    expect(footerHoursFocusFromPathname("/services/chiropractic")).toBe("paris");
    expect(footerHoursFocusFromPathname("/locations/paris")).toBe("paris");
    expect(footerHoursFocusFromPathname("/locations/paris/staff")).toBe("paris");
  });

  it("returns sulphur_springs for SS paths", () => {
    expect(footerHoursFocusFromPathname("/sulphur-springs")).toBe("sulphur_springs");
    expect(footerHoursFocusFromPathname("/sulphur-springs/staff")).toBe("sulphur_springs");
    expect(footerHoursFocusFromPathname("/locations/sulphur-springs")).toBe(
      "sulphur_springs",
    );
  });

  it("returns null for neutral paths", () => {
    expect(footerHoursFocusFromPathname("/")).toBeNull();
    expect(footerHoursFocusFromPathname("/about")).toBeNull();
    expect(footerHoursFocusFromPathname("/contact")).toBeNull();
  });

  it("strips query string before matching", () => {
    expect(footerHoursFocusFromPathname("/sulphur-springs?foo=1")).toBe("sulphur_springs");
  });
});

describe("footerHoursFocus", () => {
  it("prefers pathname over domain cookie", () => {
    expect(footerHoursFocus("/sulphur-springs", "massage")).toBe("sulphur_springs");
    expect(footerHoursFocus("/services/massage", "chiro")).toBe("paris");
  });

  it("uses domain cookie on neutral paths", () => {
    expect(footerHoursFocus("/", "massage")).toBe("paris");
    expect(footerHoursFocus("/contact", "chiro")).toBe("sulphur_springs");
    expect(footerHoursFocus("/faq", "default")).toBe("both");
  });
});
