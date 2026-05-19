import { describe, expect, it } from "vitest";
import { buildIntakeOfficeNotificationEmail } from "./intake-office-notification";

describe("buildIntakeOfficeNotificationEmail", () => {
  it("does not include patient-identifying fields in subject or body", () => {
    const { subject, text } = buildIntakeOfficeNotificationEmail({
      service: "massage",
      location: "paris",
    });
    expect(subject).toBe("New online intake submission");
    expect(text).not.toMatch(/Jane|Doe|reason for visit|Firestore|intake_forms\//i);
    expect(text).toContain("Massage therapy");
    expect(text).toContain("Paris, TX");
    expect(text).toContain("/admin/super");
  });
});
