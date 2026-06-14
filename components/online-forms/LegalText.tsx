"use client";

export function LegalText({ label, body }: { label: string; body: string }) {
  return (
    <section className="rounded-lg border border-stone-300 bg-stone-50">
      <h3 className="border-b border-stone-200 px-4 py-2 text-sm font-bold text-[var(--pp-heading)]">
        {label}
      </h3>
      <div className="max-h-72 overflow-y-auto px-4 py-3 text-sm leading-relaxed text-stone-700">
        <p className="whitespace-pre-wrap">{body}</p>
      </div>
    </section>
  );
}
