"use client";

import type {
  IntakeField,
  IntakeSignatureValue,
  IntakeDiagramValue,
  IntakeLegalText,
} from "@/lib/intakeForms/types";
import { otherKey } from "@/lib/intakeForms/validate";
import { SignaturePad } from "./SignaturePad";
import { BodyDiagram } from "./BodyDiagram";
import { LegalText } from "./LegalText";

const INPUT_CLASS =
  "focus-ring w-full rounded border border-stone-300 px-3 py-2 text-sm";

function FieldLabel({ field }: { field: IntakeField }) {
  return (
    <span className="font-semibold text-stone-800">
      {field.label}
      {field.required ? <span className="text-red-600"> *</span> : null}
    </span>
  );
}

export function DynamicField({
  field,
  answers,
  signatures,
  diagrams,
  legalText,
  error,
  onAnswerChange,
  onSignatureChange,
  onDiagramChange,
}: {
  field: IntakeField;
  answers: Record<string, unknown>;
  signatures: Record<string, IntakeSignatureValue>;
  diagrams: Record<string, IntakeDiagramValue>;
  legalText: Record<string, IntakeLegalText>;
  error?: string;
  onAnswerChange: (fieldId: string, value: unknown) => void;
  onSignatureChange: (fieldId: string, value: IntakeSignatureValue) => void;
  onDiagramChange: (fieldId: string, value: IntakeDiagramValue) => void;
}) {
  const value = answers[field.id];
  const errorNode = error ? (
    <p className="mt-1 text-sm font-semibold text-red-700">{error}</p>
  ) : null;

  switch (field.type) {
    case "heading":
      return (
        <h3 className="text-lg font-black text-[var(--pp-heading)]">{field.label}</h3>
      );

    case "note":
      return (
        <p className="rounded border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {field.label}
        </p>
      );

    case "legal-text": {
      const block = field.cmsKey ? legalText[field.cmsKey] : undefined;
      return (
        <LegalText
          label={block?.label ?? field.label}
          body={block?.body ?? ""}
        />
      );
    }

    case "signature-block":
      return (
        <SignaturePad
          field={field}
          value={signatures[field.id]}
          onChange={(v) => onSignatureChange(field.id, v)}
          error={error}
        />
      );

    case "body-diagram":
      return (
        <BodyDiagram
          field={field}
          value={diagrams[field.id]}
          onChange={(v) => onDiagramChange(field.id, v)}
          error={error}
        />
      );

    case "textarea":
      return (
        <label className="block space-y-1 text-sm">
          <FieldLabel field={field} />
          {field.helpText ? <span className="block text-xs text-stone-500">{field.helpText}</span> : null}
          <textarea
            className={`${INPUT_CLASS} min-h-[110px]`}
            value={typeof value === "string" ? value : ""}
            placeholder={field.placeholder}
            onChange={(e) => onAnswerChange(field.id, e.target.value)}
          />
          {errorNode}
        </label>
      );

    case "select":
      return (
        <label className="block space-y-1 text-sm">
          <FieldLabel field={field} />
          <select
            className={`${INPUT_CLASS} bg-white`}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onAnswerChange(field.id, e.target.value)}
          >
            <option value="">Select…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errorNode}
        </label>
      );

    case "radio":
      return (
        <fieldset className="space-y-1 text-sm">
          <legend>
            <FieldLabel field={field} />
          </legend>
          {field.helpText ? <p className="text-xs text-stone-500">{field.helpText}</p> : null}
          <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onAnswerChange(field.id, opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {errorNode}
        </fieldset>
      );

    case "checkbox":
      return (
        <div className="space-y-1 text-sm">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={value === true}
              onChange={(e) => onAnswerChange(field.id, e.target.checked)}
            />
            <FieldLabel field={field} />
          </label>
          {errorNode}
        </div>
      );

    case "checkbox-group": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (opt: string) => {
        const next = selected.includes(opt)
          ? selected.filter((o) => o !== opt)
          : [...selected, opt];
        onAnswerChange(field.id, next);
      };
      const otherVal = answers[otherKey(field.id)];
      return (
        <fieldset className="space-y-1 text-sm">
          <legend>
            <FieldLabel field={field} />
          </legend>
          <div className="grid gap-x-5 gap-y-1 pt-1 sm:grid-cols-2 lg:grid-cols-3">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {field.hasOtherText ? (
            <label className="mt-2 flex items-center gap-2">
              <span className="text-stone-700">Other:</span>
              <input
                type="text"
                className={`${INPUT_CLASS} flex-1`}
                value={typeof otherVal === "string" ? otherVal : ""}
                onChange={(e) => onAnswerChange(otherKey(field.id), e.target.value)}
              />
            </label>
          ) : null}
          {errorNode}
        </fieldset>
      );
    }

    case "scale-1-10": {
      const current = typeof value === "string" ? value : "";
      return (
        <fieldset className="space-y-1 text-sm">
          <legend>
            <FieldLabel field={field} />
          </legend>
          <div className="flex flex-wrap gap-1 pt-1">
            {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onAnswerChange(field.id, n)}
                aria-pressed={current === n}
                className={`focus-ring h-9 w-9 rounded border text-sm font-bold ${
                  current === n
                    ? "border-[var(--pp-cta)] bg-[var(--pp-cta)] text-white"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {errorNode}
        </fieldset>
      );
    }

    // text / email / tel / date / number
    default:
      return (
        <label className="block space-y-1 text-sm">
          <FieldLabel field={field} />
          {field.helpText ? <span className="block text-xs text-stone-500">{field.helpText}</span> : null}
          <input
            type={
              field.type === "email"
                ? "email"
                : field.type === "tel"
                  ? "tel"
                  : field.type === "date"
                    ? "date"
                    : field.type === "number"
                      ? "number"
                      : "text"
            }
            className={INPUT_CLASS}
            value={typeof value === "string" ? value : ""}
            placeholder={field.placeholder}
            onChange={(e) => onAnswerChange(field.id, e.target.value)}
          />
          {errorNode}
        </label>
      );
  }
}
