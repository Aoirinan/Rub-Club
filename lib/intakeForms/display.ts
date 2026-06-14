/**
 * Pure helpers shared by the admin server routes and client UI (no server deps).
 */

import type { IntakeFormDefinition } from "@/lib/intakeForms/types";
import { otherKey } from "@/lib/intakeForms/validate";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Best-effort patient/child name pulled from a submission's answers. */
export function submissionPatientName(answers: Record<string, unknown>): string {
  const first = str(answers.firstName) || str(answers.childFirstName);
  const last = str(answers.lastName) || str(answers.childLastName);
  const name = `${first} ${last}`.trim();
  return name || "(no name provided)";
}

/** Human-readable rendering of a single answer value for admin display/CSV. */
export function formatAnswerValue(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join("; ");
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

/** Combine a checkbox-group value with its "Other:" free text for display. */
export function formatAnswerWithOther(
  fieldId: string,
  answers: Record<string, unknown>,
): string {
  const base = formatAnswerValue(answers[fieldId]);
  const other = str(answers[otherKey(fieldId)]);
  if (other) return base ? `${base}; Other: ${other}` : `Other: ${other}`;
  return base;
}

/** Ordered, labeled answer rows grouped by section for the admin detail view. */
export function groupedAnswerRows(
  def: IntakeFormDefinition,
  answers: Record<string, unknown>,
) {
  return def.sections.map((section) => ({
    title: section.title,
    rows: section.fields
      .filter((f) => !["heading", "note", "legal-text", "signature-block", "body-diagram"].includes(f.type))
      .map((f) => ({
        id: f.id,
        label: f.label,
        value: formatAnswerWithOther(f.id, answers),
      })),
  }));
}
