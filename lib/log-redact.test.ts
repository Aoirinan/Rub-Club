import { describe, expect, it } from "vitest";
import { maskEmailForLog, maskPhoneForLog } from "./log-redact";

describe("maskPhoneForLog", () => {
  it("keeps only the last four digits", () => {
    expect(maskPhoneForLog("903-555-0101")).toBe("***0101");
    expect(maskPhoneForLog("+1 (903) 555-0101")).toBe("***0101");
  });
  it("handles empty input", () => {
    expect(maskPhoneForLog("")).toBe("(none)");
    expect(maskPhoneForLog(undefined)).toBe("(none)");
  });
});

describe("maskEmailForLog", () => {
  it("keeps the first character and the domain", () => {
    expect(maskEmailForLog("jane.doe@example.com")).toBe("j***@example.com");
  });
  it("never echoes something that is not an address", () => {
    expect(maskEmailForLog("not-an-email")).toBe("***");
    expect(maskEmailForLog("@example.com")).toBe("***");
    expect(maskEmailForLog("jane@")).toBe("***");
    expect(maskEmailForLog(null)).toBe("(none)");
  });
});
