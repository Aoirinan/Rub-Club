"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight self-hosted accessibility options panel (no third-party widget):
 * text size up/down, grayscale, invert/contrast, underline links, highlight
 * links, readable font, reset. Preferences persist in sessionStorage and are
 * applied as classes/inline font-size on <html> (CSS lives in globals.css).
 */

type A11yPrefs = {
  fontStep: number;
  grayscale: boolean;
  invert: boolean;
  underline: boolean;
  highlight: boolean;
  readable: boolean;
};

const DEFAULT_PREFS: A11yPrefs = {
  fontStep: 0,
  grayscale: false,
  invert: false,
  underline: false,
  highlight: false,
  readable: false,
};

const STORAGE_KEY = "rub_a11y_prefs";
const MIN_FONT_STEP = -2;
const MAX_FONT_STEP = 4;

function loadPrefs(): A11yPrefs {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<A11yPrefs>;
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      fontStep: Math.max(
        MIN_FONT_STEP,
        Math.min(MAX_FONT_STEP, Number(parsed.fontStep) || 0),
      ),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function applyPrefs(prefs: A11yPrefs): void {
  const html = document.documentElement;
  html.style.fontSize = prefs.fontStep === 0 ? "" : `${100 + prefs.fontStep * 10}%`;
  html.classList.toggle("a11y-grayscale", prefs.grayscale);
  html.classList.toggle("a11y-invert", prefs.invert);
  html.classList.toggle("a11y-underline", prefs.underline);
  html.classList.toggle("a11y-highlight", prefs.highlight);
  html.classList.toggle("a11y-readable", prefs.readable);
}

function ToggleRow({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`focus-ring flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm font-bold transition-colors ${
        pressed ? "bg-[#0f5f5c] text-white" : "bg-stone-100 text-[#173f3b] hover:bg-stone-200"
      }`}
    >
      {label}
      <span
        aria-hidden
        className={`ml-3 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
          pressed ? "bg-[#f2d25d]" : "bg-stone-300"
        }`}
      />
    </button>
  );
}

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = loadPrefs();
    setPrefs(initial);
    applyPrefs(initial);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const update = (patch: Partial<A11yPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      applyPrefs(next);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const reset = () => {
    applyPrefs(DEFAULT_PREFS);
    setPrefs(DEFAULT_PREFS);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={panelRef} className="fixed bottom-20 left-3 z-[80] md:bottom-6">
      {open ? (
        <div
          role="dialog"
          aria-label="Accessibility options"
          className="absolute bottom-14 left-0 w-64 rounded-xl border border-stone-200 bg-white p-3 shadow-2xl"
        >
          <p className="px-1 pb-2 text-xs font-black uppercase tracking-wide text-[#173f3b]">
            Accessibility options
          </p>
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className="flex-1 text-sm font-bold text-[#173f3b]">Text size</span>
            <button
              type="button"
              onClick={() => update({ fontStep: Math.max(MIN_FONT_STEP, prefs.fontStep - 1) })}
              disabled={prefs.fontStep <= MIN_FONT_STEP}
              className="focus-ring h-8 w-8 rounded bg-stone-100 text-base font-black text-[#173f3b] hover:bg-stone-200 disabled:opacity-40"
              aria-label="Decrease text size"
            >
              A−
            </button>
            <button
              type="button"
              onClick={() => update({ fontStep: Math.min(MAX_FONT_STEP, prefs.fontStep + 1) })}
              disabled={prefs.fontStep >= MAX_FONT_STEP}
              className="focus-ring h-8 w-8 rounded bg-stone-100 text-base font-black text-[#173f3b] hover:bg-stone-200 disabled:opacity-40"
              aria-label="Increase text size"
            >
              A+
            </button>
          </div>
          <div className="space-y-1.5">
            <ToggleRow
              label="Grayscale"
              pressed={prefs.grayscale}
              onClick={() => update({ grayscale: !prefs.grayscale })}
            />
            <ToggleRow
              label="Invert colors"
              pressed={prefs.invert}
              onClick={() => update({ invert: !prefs.invert })}
            />
            <ToggleRow
              label="Underline links"
              pressed={prefs.underline}
              onClick={() => update({ underline: !prefs.underline })}
            />
            <ToggleRow
              label="Highlight links"
              pressed={prefs.highlight}
              onClick={() => update({ highlight: !prefs.highlight })}
            />
            <ToggleRow
              label="Readable font"
              pressed={prefs.readable}
              onClick={() => update({ readable: !prefs.readable })}
            />
          </div>
          <button
            type="button"
            onClick={reset}
            className="focus-ring mt-2 w-full rounded px-3 py-2 text-center text-sm font-bold text-stone-600 underline hover:text-[#0f5f5c]"
          >
            Reset all
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Accessibility options"
        className="focus-ring flex h-11 w-11 items-center justify-center rounded-full bg-[#0f5f5c] text-white shadow-lg hover:bg-[#0f817b]"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
          <circle cx="12" cy="4.5" r="2.2" />
          <path d="M21.2 7.6c-2.7.8-5.8 1.3-9.2 1.3S5.5 8.4 2.8 7.6l-.6 1.9c1.9.6 4.1 1 6.4 1.2.2 2.8-.5 6.4-1.9 9.7l1.9.8c1-2.4 1.7-4.9 2.1-7.1h2.6c.4 2.2 1.1 4.7 2.1 7.1l1.9-.8c-1.4-3.3-2.1-6.9-1.9-9.7 2.3-.2 4.5-.6 6.4-1.2l-.6-1.9z" />
        </svg>
      </button>
    </div>
  );
}
