import type { IntakeFormDefinition } from "@/lib/intakeForms/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const email = raw.trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : undefined;
}

/** Best-effort patient email from form answers — never included in office notifications. */
export function extractSubmitterEmail(
  definition: IntakeFormDefinition,
  answers: Record<string, unknown>,
  signatures: Record<string, { email?: string }>,
): string | undefined {
  const direct = normalizeEmail(answers.email);
  if (direct) return direct;

  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (field.type === "email") {
        const fromField = normalizeEmail(answers[field.id]);
        if (fromField) return fromField;
      }
    }
  }

  for (const sig of Object.values(signatures)) {
    const fromSig = normalizeEmail(sig.email);
    if (fromSig) return fromSig;
  }

  return undefined;
}

/** Best-effort display name for acknowledgment greeting — first name only in email. */
export function extractSubmitterName(
  definition: IntakeFormDefinition,
  answers: Record<string, unknown>,
): string | undefined {
  const candidates = ["firstName", "first_name", "name", "patientName", "legalName"];
  for (const key of candidates) {
    const raw = answers[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }

  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (/name/i.test(field.id) && typeof answers[field.id] === "string") {
        const v = (answers[field.id] as string).trim();
        if (v) return v;
      }
    }
  }

  return undefined;
}

export function defaultOnlineFormNotifyEmails(): string[] {
  const office = process.env.OFFICE_NOTIFICATION_EMAIL?.trim();
  if (office && office.includes("@")) return [office];
  const reschedule = process.env.RESCHEDULE_EMAIL?.trim();
  if (reschedule && reschedule.includes("@")) return [reschedule];
  return [];
}
