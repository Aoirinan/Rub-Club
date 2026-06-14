/**
 * Default, superadmin-editable copy for each online form.
 *
 * These are seeds only. Once a form's config doc exists in Firestore the seed
 * script leaves `enabled` and the copy fields alone (idempotent), so clinic
 * edits are never clobbered by a re-run.
 */

import { PLACEHOLDER_PREFIX } from "@/lib/intakeForms/legal-text";

export const INTAKE_FORMS_CONFIG_COLLECTION = "intake_forms_config";
export const INTAKE_GLOBAL_DOC_ID = "_global";

export const DEFAULT_INTRO_TEXT = "Let us get started filling out this form.";

export const DEFAULT_CONSENT_CHECKBOX_LABEL =
  "I understand this is a legal agreement and intend to sign. I also agree to sign this agreement electronically.";

export const DEFAULT_SUCCESS_MESSAGE =
  "Thank you. Your form has been submitted to our office. We'll review it before your visit.";

export const DEFAULT_DISABLED_MESSAGE =
  "This form is temporarily unavailable. Please call our office and we'll be glad to help.";

export const DEFAULT_TERMS_HTML =
  `${PLACEHOLDER_PREFIX} — replace with the clinic's attorney-approved informed consent, ` +
  `HIPAA Notice of Privacy Practices acknowledgment, and financial policy language. ` +
  `Editable by a superadmin in Admin → Online Forms.]`;

export type IntakeFormSeed = {
  slug: string;
  title: string;
  order: number;
  introText?: string;
};

/**
 * The five forms, in display order. `definitions.ts` holds the actual field
 * layout for each slug; this list drives seeding + the admin list.
 */
export const INTAKE_FORM_SEEDS: IntakeFormSeed[] = [
  { slug: "new-patient-intake-and-consents", title: "New Patient Intake and Consents", order: 1 },
  { slug: "massage-intake-form", title: "Massage Therapy Intake", order: 2 },
  { slug: "vehicle-accident-form", title: "Vehicle Accident Information", order: 3 },
  { slug: "consent-only-form", title: "Consent Only", order: 4 },
  { slug: "pediatric-intake", title: "Pediatric History Form", order: 5 },
];

export const INTAKE_FORM_SLUGS = INTAKE_FORM_SEEDS.map((f) => f.slug);
