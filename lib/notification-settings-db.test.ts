import { describe, expect, it } from "vitest";
import { parseNotificationTemplatesPatch } from "./notification-settings-db";

describe("parseNotificationTemplatesPatch", () => {
  it("keeps the template fields the settings reader uses", () => {
    const patch = parseNotificationTemplatesPatch({
      sms: { customer: { first_time: "Hi [CustomerFirstLastName]" } },
      email: { internal: { standard: { subject: "S", body: "B" } } },
    });
    expect(patch).toEqual({
      sms: { customer: { first_time: "Hi [CustomerFirstLastName]" } },
      email: { internal: { standard: { subject: "S", body: "B" } } },
    });
  });

  it("drops fields nothing reads instead of storing them", () => {
    const patch = parseNotificationTemplatesPatch({
      sms: { customer: { first_time: "Hi", extra: "x" }, vendor: { a: 1 } },
      email: { customer: { standard: { subject: "S", body: "B", bcc: "someone@example.com" } } },
      webhookUrl: "https://example.com",
    });
    expect(patch).toEqual({
      sms: { customer: { first_time: "Hi" } },
      email: { customer: { standard: { subject: "S", body: "B" } } },
    });
  });

  it("rejects wrong types and a bad reschedule address", () => {
    expect(parseNotificationTemplatesPatch({ sms: { customer: { first_time: 5 } } })).toBeNull();
    expect(parseNotificationTemplatesPatch({ email: { customer: { standard: "text" } } })).toBeNull();
    expect(parseNotificationTemplatesPatch({ rescheduleEmail: "not-an-email" })).toBeNull();
    expect(parseNotificationTemplatesPatch({ sms: { customer: { first_time: "x".repeat(2001) } } })).toBeNull();
  });

  it("accepts a reschedule address on its own", () => {
    expect(parseNotificationTemplatesPatch({ rescheduleEmail: " desk@example.com " })).toEqual({
      rescheduleEmail: "desk@example.com",
    });
  });
});
