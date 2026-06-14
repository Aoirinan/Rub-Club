"use client";

import { useState } from "react";

export function ConsentGate({
  introText,
  consentCheckboxLabel,
  termsHtml,
  accepted,
  onAcceptedChange,
  onStart,
}: {
  introText: string;
  consentCheckboxLabel: string;
  termsHtml: string;
  accepted: boolean;
  onAcceptedChange: (next: boolean) => void;
  onStart: () => void;
}) {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-stone-700">{introText}</p>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
        />
        <span className="text-stone-800">{consentCheckboxLabel}</span>
      </label>

      <button
        type="button"
        onClick={() => setShowTerms(true)}
        className="focus-ring text-sm font-semibold text-[var(--pp-accent)] underline"
      >
        Terms of consent
      </button>

      <div>
        <button
          type="button"
          onClick={onStart}
          disabled={!accepted}
          className="focus-ring inline-flex bg-[#f19f1f] px-8 py-3 text-sm font-black uppercase tracking-wide text-[#3a2a06] shadow-sm transition hover:bg-[#d98c12] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Get Started
        </button>
        {!accepted ? (
          <p className="mt-2 text-xs text-stone-500">
            Please check the box above to begin.
          </p>
        ) : null}
      </div>

      {showTerms ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Terms of consent"
          onClick={() => setShowTerms(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
              <h2 className="text-base font-black text-[var(--pp-heading)]">Terms of consent</h2>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="focus-ring rounded px-2 py-1 text-sm font-bold text-stone-600 hover:bg-stone-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[64vh] overflow-y-auto px-5 py-4 text-sm leading-relaxed text-stone-700">
              <p className="whitespace-pre-wrap">{termsHtml}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
