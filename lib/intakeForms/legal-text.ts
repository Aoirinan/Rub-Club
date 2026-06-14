/**
 * Editable legal / consent prose for the online forms.
 *
 * IMPORTANT (IP + compliance): every block below is seeded as a clearly-marked
 * PLACEHOLDER. Do NOT paste any third-party e-signature vendor's terms of
 * service or another practice's copyrighted language here. The clinic's
 * attorney-approved text replaces each block in the superadmin "Online Forms"
 * tab before launch — no deploy required.
 *
 * Blocks are keyed by `cmsKey` and reused across forms, so editing
 * `cancellation_policy` once updates every form that references it.
 */

export const INTAKE_LEGAL_TEXT_COLLECTION = "intake_legal_text";

export const PLACEHOLDER_PREFIX = "[PLACEHOLDER";

const CLINIC_OFFICE_BLOCK =
  "Chiropractic Associates — 3305 NE Loop 286, Suite A, Paris, TX 75460. " +
  "Treating doctors: Dr. Sean Welborn, DC; Dr. Greg Thompson, DC; Dr. Brandy Collins, DC.";

function placeholder(description: string, extra?: string): string {
  return (
    `${PLACEHOLDER_PREFIX} — replace with the clinic's attorney-approved ${description}. ` +
    `This text is editable by a superadmin in Admin → Online Forms and is shown to ` +
    `patients exactly as entered.]` +
    (extra ? `\n\n${extra}` : "")
  );
}

export type LegalTextSeed = {
  cmsKey: string;
  label: string;
  body: string;
};

export const INTAKE_LEGAL_TEXT_SEEDS: LegalTextSeed[] = [
  {
    cmsKey: "informed_consent",
    label: "Informed Consent to Chiropractic Treatment",
    body: placeholder(
      "informed consent to chiropractic treatment language",
      CLINIC_OFFICE_BLOCK,
    ),
  },
  {
    cmsKey: "pediatric_informed_consent",
    label: "Informed Consent for Chiropractic Treatment (Pediatric)",
    body: placeholder(
      "pediatric informed consent language, including guardian-responsibility and divorce/custody authority statements",
      CLINIC_OFFICE_BLOCK,
    ),
  },
  {
    cmsKey: "tpo_consent",
    label: "Consent for Treatment, Payment & Healthcare Operations (TPO)",
    body: placeholder(
      "Consent for Treatment, Payment, and Healthcare Operations (TPO) language",
    ),
  },
  {
    cmsKey: "confidential_comm",
    label: "Confidential Communication Request (HIPAA)",
    body: placeholder(
      "confidential communication request language describing how the office may contact the patient",
    ),
  },
  {
    cmsKey: "notice_privacy_practices",
    label: "Notice of Privacy Practices (HIPAA)",
    body: placeholder("HIPAA Notice of Privacy Practices"),
  },
  {
    cmsKey: "cancellation_policy",
    label: "Cancellation Policy & Fee Schedule",
    body: placeholder(
      "cancellation policy and fee schedule (e.g. 24-hour notice requirement and the clinic's own cancellation / no-show fees)",
    ),
  },
  {
    cmsKey: "massage_cancellation_policy",
    label: "Cancellation Policy & Fee Schedule (Massage)",
    body: placeholder(
      "massage cancellation policy and fee schedule (The Rub Club's own no-show / late-cancellation fees)",
    ),
  },
  {
    cmsKey: "massage_consent",
    label: "Massage Therapy Acknowledgment",
    body: placeholder(
      "massage therapy acknowledgment (the \"by typing your name below…\" consent-to-treat language)",
    ),
  },
  {
    cmsKey: "pediatric_welcome",
    label: "Pediatric Welcome Message",
    body: placeholder("pediatric intake welcome message"),
  },
];

export const INTAKE_LEGAL_TEXT_KEYS = INTAKE_LEGAL_TEXT_SEEDS.map((s) => s.cmsKey);

export function isPlaceholderLegalText(body: string | undefined | null): boolean {
  return !body || body.trimStart().startsWith(PLACEHOLDER_PREFIX);
}
