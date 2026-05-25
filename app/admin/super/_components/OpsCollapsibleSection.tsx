"use client";

import { useState, type ReactNode } from "react";

type Props = {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export function OpsCollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  children,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {summary ? (
            <p className="mt-0.5 text-sm text-slate-600">{summary}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-sm font-semibold text-slate-500" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4">{children}</div> : null}
    </section>
  );
}
