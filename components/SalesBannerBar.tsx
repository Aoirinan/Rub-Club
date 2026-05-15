"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type SalesBannerPayload = {
  html: string;
  dismissKey: string;
};

export function SalesBannerBar({ payload }: { payload: SalesBannerPayload }) {
  const storageKey = useMemo(() => `rub_banner_dismissed_${payload.dismissKey}`, [payload.dismissKey]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "1") setHidden(true);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const onDismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  }, [storageKey]);

  if (hidden || !payload.html.trim()) return null;

  return (
    <div
      role="region"
      aria-label="Announcement"
      className="relative z-30 border-b border-white/20 bg-[#0f5f5c] px-4 py-3 text-center text-sm text-white shadow-md"
    >
      <div
        className="mx-auto max-w-5xl pr-10 [&_a]:font-bold [&_a]:text-[#f2d25d] [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: payload.html }}
      />
      <button
        type="button"
        onClick={onDismiss}
        className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white/10 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/20"
        aria-label="Dismiss announcement"
      >
        Close
      </button>
    </div>
  );
}
