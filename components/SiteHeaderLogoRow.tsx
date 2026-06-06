"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { resolveHeaderCompact } from "@/lib/header-compact-scroll";

const HeaderCompactContext = createContext(false);

export function useHeaderCompact(): boolean {
  return useContext(HeaderCompactContext);
}

export function SiteHeaderLogoRow({ children }: { children: ReactNode }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      setCompact((prev) => resolveHeaderCompact(prev, window.scrollY));
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <HeaderCompactContext.Provider value={compact}>
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
    </HeaderCompactContext.Provider>
  );
}
