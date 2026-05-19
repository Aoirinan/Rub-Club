import { siteUrl } from "@/lib/site-content";

/** Office alert copy — no PHI (names, clinical text, document details). SendGrid is not HIPAA-eligible. */
export function buildIntakeOfficeNotificationEmail(opts: {
  service?: string;
  location?: string;
}): { subject: string; text: string } {
  const adminUrl = siteUrl("/admin/super");
  const service =
    opts.service === "chiropractic"
      ? "Chiropractic"
      : opts.service === "massage"
        ? "Massage therapy"
        : "Not specified";
  const location =
    opts.location === "sulphur_springs"
      ? "Sulphur Springs, TX"
      : opts.location === "paris"
        ? "Paris, TX"
        : "Not specified";

  return {
    subject: "New online intake submission",
    text: [
      "A patient submitted the online intake form.",
      "",
      `Service: ${service}`,
      `Location: ${location}`,
      "",
      "Open the staff dashboard to review the full record (including any uploaded insurance or ID images):",
      adminUrl,
      "",
      "Do not forward intake contents by personal email or text.",
    ].join("\n"),
  };
}
