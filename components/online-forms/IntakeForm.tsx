"use client";

import { useState } from "react";
import type {
  IntakeFormConfig,
  IntakeFormDefinition,
  IntakeLegalText,
  IntakeField,
  IntakeSignatureValue,
  IntakeDiagramValue,
} from "@/lib/intakeForms/types";
import {
  validateForm,
  pruneHiddenValues,
  isFieldVisible,
  type IntakeFormState,
} from "@/lib/intakeForms/validate";
import { ConsentGate } from "./ConsentGate";
import { DynamicField } from "./DynamicField";

const WIDE_TYPES = new Set([
  "heading",
  "note",
  "legal-text",
  "signature-block",
  "body-diagram",
  "textarea",
  "checkbox-group",
  "scale-1-10",
  "radio",
]);

function spanClass(field: IntakeField): string {
  if (WIDE_TYPES.has(field.type)) return "sm:col-span-4";
  switch (field.width) {
    case "quarter":
      return "sm:col-span-1";
    case "half":
      return "sm:col-span-2";
    default:
      return "sm:col-span-4";
  }
}

export function IntakeForm({
  config,
  definition,
  legalText,
  preview = false,
}: {
  config: IntakeFormConfig;
  definition: IntakeFormDefinition;
  legalText: Record<string, IntakeLegalText>;
  /** Staff preview of a disabled form: render everything but block submission. */
  preview?: boolean;
}) {
  const [started, setStarted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [signatures, setSignatures] = useState<Record<string, IntakeSignatureValue>>({});
  const [diagrams, setDiagrams] = useState<Record<string, IntakeDiagramValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function setAnswer(fieldId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }
  function setSignature(fieldId: string, value: IntakeSignatureValue) {
    setSignatures((prev) => ({ ...prev, [fieldId]: value }));
  }
  function setDiagram(fieldId: string, value: IntakeDiagramValue) {
    setDiagrams((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSubmit() {
    setFormError(null);
    if (preview) {
      setFormError("Preview mode — enable this form in Admin → Online forms to accept submissions.");
      return;
    }
    const state: IntakeFormState = { answers, signatures, diagrams, consentAccepted: accepted };
    const pruned = pruneHiddenValues(definition, state);
    const result = validateForm(definition, pruned);
    if (!result.ok) {
      setErrors(result.errors);
      if (result.firstErrorId) {
        document
          .getElementById(`field-${result.firstErrorId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setFormError("Please fix the highlighted fields and try again.");
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/online-forms/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          formSlug: definition.slug,
          answers: pruned.answers,
          signatures: pruned.signatures,
          diagrams: pruned.diagrams,
          consentAccepted: pruned.consentAccepted,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFormError(data.error || "We could not submit your form. Please call our office.");
        return;
      }
      setSubmitted(true);
      setAnswers({});
      setSignatures({});
      setDiagrams({});
      setAccepted(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("We could not submit your form. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-xl font-black text-emerald-900">Thank you</h2>
        <p className="mt-3 whitespace-pre-wrap text-emerald-900">{config.successMessage}</p>
      </div>
    );
  }

  if (!started) {
    return (
      <ConsentGate
        introText={config.introText}
        consentCheckboxLabel={config.consentCheckboxLabel}
        termsHtml={config.termsHtml}
        accepted={accepted}
        onAcceptedChange={setAccepted}
        onStart={() => setStarted(true)}
      />
    );
  }

  return (
    <div className="space-y-10">
      {definition.sections.map((section, sIdx) => {
        const visibleFields = section.fields.filter((f) => isFieldVisible(f, answers));
        if (visibleFields.length === 0) return null;
        return (
          <section key={`${section.title}-${sIdx}`} className="space-y-4">
            {section.title ? (
              <h2 className="border-b-2 border-[var(--pp-accent)] pb-1 text-lg font-black text-[var(--pp-heading)]">
                {section.title}
              </h2>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              {visibleFields.map((field) => (
                <div key={field.id} id={`field-${field.id}`} className={spanClass(field)}>
                  <DynamicField
                    field={field}
                    answers={answers}
                    signatures={signatures}
                    diagrams={diagrams}
                    legalText={legalText}
                    error={errors[field.id]}
                    onAnswerChange={setAnswer}
                    onSignatureChange={setSignature}
                    onDiagramChange={setDiagram}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {formError ? (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || preview}
          title={preview ? "Submissions are disabled in preview mode" : undefined}
          className="focus-ring inline-flex bg-[var(--pp-cta)] px-8 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-[var(--pp-cta-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting…" : preview ? "Submit (disabled in preview)" : "Submit"}
        </button>
        <p className="text-xs text-stone-500">
          Please review your answers before submitting. Required fields are marked with{" "}
          <span className="text-red-600">*</span>.
        </p>
      </div>
    </div>
  );
}
