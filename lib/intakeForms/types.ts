/**
 * Online Patient Forms — shared types.
 *
 * Form field definitions live in `definitions.ts` (version-controlled), not in
 * Firestore, so a bad admin edit can never break rendering. Editable copy
 * (intro/consent/terms/success/disabled + legal prose) lives in Firestore and
 * is read through `config-db.ts`.
 */

export type IntakeFieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "date"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "checkbox-group"
  | "scale-1-10"
  | "heading"
  | "note"
  | "legal-text" // read-only consent/policy prose; body pulled from the legal-text store
  | "body-diagram" // drawable front+back body chart with Undo/Clear, saved as PNGs
  | "signature-block"; // a sign-here unit; can appear MULTIPLE times in one form

export type IntakeFieldWidth = "full" | "half" | "quarter";

/** Only render a field when another field's value matches. */
export type IntakeShowWhen = {
  fieldId: string;
  equals: string | string[];
};

export type IntakeField = {
  id: string;
  label: string;
  type: IntakeFieldType;
  required?: boolean;
  options?: string[]; // for select/radio/checkbox-group
  hasOtherText?: boolean; // append an "Other:" free-text box
  placeholder?: string;
  helpText?: string;
  sensitive?: boolean; // render masked, minimize collection
  width?: IntakeFieldWidth;

  // signature-block options:
  includePrintedName?: boolean; // default true
  includeEmail?: boolean; // default true
  includeDate?: boolean; // default true; auto-filled, read-only

  // conditional display:
  showWhen?: IntakeShowWhen;

  // legal-text options:
  cmsKey?: string; // key into the editable legal-text store
};

export type IntakeSection = {
  title: string;
  fields: IntakeField[];
};

export type IntakeFormDefinition = {
  slug: string;
  title: string;
  /** Which office branding/footer the public page should show. */
  brand?: "chiropractic" | "rub_club";
  sections: IntakeSection[];
};

/** Per-form, superadmin-editable copy stored in `intake_forms_config/{slug}`. */
export type IntakeFormConfig = {
  slug: string;
  title: string;
  enabled: boolean;
  order: number;
  introText: string;
  consentCheckboxLabel: string;
  termsHtml: string;
  successMessage: string;
  disabledMessage: string;
  notifyEmails: string[];
  updatedAt: string | null;
  updatedBy: string | null;
};

/** Master switch stored at `intake_forms_config/_global`. */
export type IntakeGlobalConfig = {
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

/** Editable consent/policy prose stored in `intake_legal_text/{cmsKey}`. */
export type IntakeLegalText = {
  cmsKey: string;
  label: string;
  body: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type IntakeSignatureValue = {
  signatureImage: string; // base64 PNG data URL, or "" when typed-name fallback used
  printedName?: string;
  email?: string;
  dateSigned?: string;
  typedName?: string; // keyboard fallback when canvas unsupported
};

export type IntakeDiagramValue = {
  frontImage: string; // base64 PNG data URL
  backImage: string; // base64 PNG data URL
};

export type IntakeSubmissionStatus = "new" | "reviewed" | "archived";

export type IntakeSubmissionInput = {
  formSlug: string;
  formTitle: string;
  answers: Record<string, unknown>;
  signatures: Record<string, IntakeSignatureValue>;
  diagrams: Record<string, IntakeDiagramValue>;
  consentAccepted: boolean;
  consentLabelAtSubmit: string;
  meta: {
    ipAddress: string;
    userAgent: string;
  };
};

export type IntakeSubmissionRecord = {
  id: string;
  formSlug: string;
  formTitle: string;
  answers: Record<string, unknown>;
  signatures: Record<string, IntakeSignatureValue>;
  diagrams: Record<string, IntakeDiagramValue>;
  consentAccepted: boolean;
  consentLabelAtSubmit: string;
  meta: {
    ipAddress: string;
    userAgent: string;
    submittedAt: string | null;
  };
  status: IntakeSubmissionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
};
