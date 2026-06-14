/**
 * Shared visibility + validation logic for the online forms.
 *
 * Used by the public client (inline errors) AND the submit API route
 * (authoritative re-validation). Keeping it in one module means the server can
 * never be tricked into accepting a payload the UI would have rejected.
 */

import type {
  IntakeField,
  IntakeFormDefinition,
  IntakeSignatureValue,
  IntakeDiagramValue,
} from "@/lib/intakeForms/types";
import { flattenFields } from "@/lib/intakeForms/definitions";

/** Field types that do not collect an answer (display-only). */
const DISPLAY_ONLY = new Set(["heading", "note", "legal-text"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function otherKey(fieldId: string): string {
  return `${fieldId}__other`;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Evaluate a field's `showWhen` against the current answers. */
export function isFieldVisible(
  field: IntakeField,
  answers: Record<string, unknown>,
): boolean {
  if (!field.showWhen) return true;
  const current = answers[field.showWhen.fieldId];
  const expected = field.showWhen.equals;
  const matchesOne = (val: string) =>
    Array.isArray(expected) ? expected.includes(val) : val === expected;

  if (Array.isArray(current)) {
    return current.some((v) => typeof v === "string" && matchesOne(v));
  }
  return typeof current === "string" && matchesOne(current);
}

export type IntakeFormState = {
  answers: Record<string, unknown>;
  signatures: Record<string, IntakeSignatureValue>;
  diagrams: Record<string, IntakeDiagramValue>;
  consentAccepted: boolean;
};

export type ValidationResult = {
  ok: boolean;
  errors: Record<string, string>;
  firstErrorId: string | null;
};

function signatureProvided(sig: IntakeSignatureValue | undefined): boolean {
  if (!sig) return false;
  return Boolean(sig.signatureImage?.trim()) || Boolean(sig.typedName?.trim());
}

/**
 * Validate a form submission. Only visible fields are checked. Signature blocks
 * are required by default (they are consent signatures); set `required: false`
 * on the field to make one optional.
 */
export function validateForm(
  def: IntakeFormDefinition,
  state: IntakeFormState,
): ValidationResult {
  const errors: Record<string, string> = {};
  const fields = flattenFields(def);

  for (const field of fields) {
    if (DISPLAY_ONLY.has(field.type)) continue;
    if (!isFieldVisible(field, state.answers)) continue;

    if (field.type === "signature-block") {
      const sig = state.signatures[field.id];
      const required = field.required !== false;
      if (required && !signatureProvided(sig)) {
        errors[field.id] = "Please sign here (draw your signature or type your name).";
        continue;
      }
      if (signatureProvided(sig) && field.includePrintedName !== false) {
        if (!asString(sig?.printedName)) {
          errors[field.id] = "Please enter your printed name.";
        }
      }
      if (signatureProvided(sig) && field.includeEmail && asString(sig?.email)) {
        if (!EMAIL_RE.test(asString(sig?.email))) {
          errors[field.id] = "Please enter a valid email.";
        }
      }
      continue;
    }

    if (field.type === "body-diagram") {
      if (field.required) {
        const diag = state.diagrams[field.id];
        if (!diag || (!diag.frontImage?.trim() && !diag.backImage?.trim())) {
          errors[field.id] = "Please mark the diagram.";
        }
      }
      continue;
    }

    const value = state.answers[field.id];

    if (field.type === "checkbox") {
      if (field.required && value !== true) {
        errors[field.id] = "This box must be checked to continue.";
      }
      continue;
    }

    if (field.type === "checkbox-group") {
      const selected = asStringArray(value);
      if (field.required && selected.length === 0) {
        errors[field.id] = "Please select at least one option.";
      }
      continue;
    }

    const str = asString(value);
    if (field.required && !str) {
      errors[field.id] = "This field is required.";
      continue;
    }
    if (str && field.type === "email" && !EMAIL_RE.test(str)) {
      errors[field.id] = "Please enter a valid email address.";
      continue;
    }
    if (str && field.type === "tel") {
      const digits = str.replace(/\D/g, "");
      if (digits.length < 7) {
        errors[field.id] = "Please enter a valid phone number.";
      }
    }
  }

  const ordered = fields.find((f) => errors[f.id]);
  return {
    ok: Object.keys(errors).length === 0,
    errors,
    firstErrorId: ordered?.id ?? null,
  };
}

/**
 * Strip answers/signatures/diagrams for fields that are not currently visible
 * (per `showWhen`) so hidden fields are never submitted or stored.
 */
export function pruneHiddenValues(
  def: IntakeFormDefinition,
  state: IntakeFormState,
): IntakeFormState {
  const fields = flattenFields(def);
  const visibleIds = new Set(
    fields.filter((f) => isFieldVisible(f, state.answers)).map((f) => f.id),
  );

  const answers: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(state.answers)) {
    const baseId = key.endsWith("__other") ? key.slice(0, -"__other".length) : key;
    if (visibleIds.has(baseId)) answers[key] = val;
  }
  const signatures: Record<string, IntakeSignatureValue> = {};
  for (const [key, val] of Object.entries(state.signatures)) {
    if (visibleIds.has(key)) signatures[key] = val;
  }
  const diagrams: Record<string, IntakeDiagramValue> = {};
  for (const [key, val] of Object.entries(state.diagrams)) {
    if (visibleIds.has(key)) diagrams[key] = val;
  }
  return { answers, signatures, diagrams, consentAccepted: state.consentAccepted };
}
