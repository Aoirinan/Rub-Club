"use client";

import type { ReactNode } from "react";
import { useHeaderCompact } from "@/components/HeaderThemeProvider";

// Re-exported for existing consumers (e.g. HeaderBrandLogoStrip).
export { useHeaderCompact };

export function SiteHeaderLogoRow({ children }: { children: ReactNode }) {
  const compact = useHeaderCompact();

  return (
    <div
      data-header-compact={compact ? "true" : "false"}
      className={`bg-[var(--header-logo-row-bg)] px-4 transition-[padding] duration-300 ease-out ${
        compact ? "py-1 sm:py-1.5" : "py-2 sm:py-2.5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 sm:gap-3">
        {children}
      </div>
    </div>
  );
}
