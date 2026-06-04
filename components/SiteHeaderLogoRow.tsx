"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/** Scroll past this (px) before the center logo shrinks to side size. */
const COMPACT_SCROLL_Y = 48;

const HeaderCompactContext = createContext(false);

export function useHeaderCompact(): boolean {
  return useContext(HeaderCompactContext);
}

export function SiteHeaderLogoRow({ children }: { children: ReactNode }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const update = () => setCompact(window.scrollY > COMPACT_SCROLL_Y);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <HeaderCompactContext.Provider value={compact}>
      <div
        data-header-compact={compact ? "true" : "false"}
        className={`bg-white px-4 transition-[padding] duration-300 ease-out ${
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
