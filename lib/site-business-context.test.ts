import { describe, expect, it } from "vitest";
import {
  bookingPageBusinessContext,
  businessContextCookieValue,
  resolveBusinessContext,
} from "@/lib/site-business-context";

describe("bookingPageBusinessContext", () => {
  it("treats /book opened for Sulphur Springs as a Sulphur Springs page", () => {
    expect(
      bookingPageBusinessContext("/book", "service=chiropractic&location=sulphur_springs"),
    ).toBe("sulphur_springs");
    expect(bookingPageBusinessContext("/book", new URLSearchParams("location=sulphur-springs"))).toBe(
      "sulphur_springs",
    );
  });

  it("leaves every other booking URL to the visitor's cookie", () => {
    expect(bookingPageBusinessContext("/book", "")).toBeNull();
    expect(bookingPageBusinessContext("/book", "location=paris")).toBeNull();
    expect(bookingPageBusinessContext("/book", "service=massage")).toBeNull();
    expect(bookingPageBusinessContext("/book/manage", "location=sulphur_springs")).toBeNull();
    expect(bookingPageBusinessContext("/contact", "location=sulphur_springs")).toBeNull();
  });
});

describe("businessContextCookieValue", () => {
  it("keeps the pathname rules", () => {
    expect(businessContextCookieValue("/sulphur-springs/staff")).toBe("sulphur_springs");
    expect(businessContextCookieValue("/services/chiropractic/acupuncture")).toBe("paris_chiro");
    expect(businessContextCookieValue("/book")).toBeNull();
    expect(businessContextCookieValue("/")).toBeNull();
  });

  it("sets Sulphur Springs for the SS booking URL only", () => {
    expect(
      businessContextCookieValue("/book", new URLSearchParams("location=sulphur_springs")),
    ).toBe("sulphur_springs");
    expect(businessContextCookieValue("/book", new URLSearchParams("location=paris"))).toBeNull();
    expect(businessContextCookieValue("/book", new URLSearchParams())).toBeNull();
    // A query string never changes a business route's own context.
    expect(
      businessContextCookieValue(
        "/services/chiropractic/acupuncture",
        new URLSearchParams("location=sulphur_springs"),
      ),
    ).toBe("paris_chiro");
  });

  it("/book stays a shared page that follows the cookie", () => {
    expect(resolveBusinessContext("/book", "sulphur_springs")).toBe("sulphur_springs");
    expect(resolveBusinessContext("/book", undefined)).toBe("default");
  });
});
