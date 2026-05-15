"use client";

import { useEffect, useMemo, useState } from "react";
import type { SpecialsConfig } from "@/lib/site-owner-config";

const SESSION_KEY = "rub_specials_popup_seen";

function readDomainCookie(): "massage" | "chiro" | "default" {
  if (typeof document === "undefined") return "default";
  const m = document.cookie.match(/(?:^|;\s*)rub_domain_ctx=([^;]+)/);
  const v = m?.[1] ? decodeURIComponent(m[1]) : "";
  if (v === "massage" || v === "chiro" || v === "default") return v;
  return "default";
}

export function DomainSpecialsPopup() {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState<string | null>(null);

  const ctx = useMemo(() => readDomainCookie(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/marketing", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { specials?: SpecialsConfig };
        const s = data.specials;
        if (!s) return;
        const body =
          ctx === "massage" ? s.massageHtml : ctx === "chiro" ? s.chiroHtml : s.generalHtml;
        if (!body || !body.trim()) return;
        if (cancelled) return;
        setHtml(body);
        setOpen(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ctx]);

  function close() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open || !html) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="specials-title"
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        <h2 id="specials-title" className="text-xl font-black text-[#173f3b]">
          Specials
        </h2>
        <div
          className="prose prose-sm mt-4 max-w-none text-stone-800 prose-a:text-[#0f5f5c]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <button
          type="button"
          onClick={close}
          className="focus-ring mt-6 w-full rounded-full bg-[#0f5f5c] py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
