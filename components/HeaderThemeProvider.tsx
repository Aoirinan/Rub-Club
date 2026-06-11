"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  headerBandColorsToCssVars,
  headerColorsForBusinessContext,
  type HeaderColorConfig,
} from "@/lib/header-colors";
import type { SiteBusinessContext } from "@/lib/site-business-context";
import { useSiteBusinessContext } from "@/lib/use-site-business-context";
import { resolveHeaderCompact } from "@/lib/header-compact-scroll";

/**
 * Shared shrink-on-scroll state for the whole header: tier 1 (phone bar)
 * collapses, the logo row and nav slim down together. Owned here so every
 * header band reads the same value from one scroll listener.
 */
const HeaderCompactContext = createContext(false);

export function useHeaderCompact(): boolean {
  return useContext(HeaderCompactContext);
}

export function HeaderThemeProvider({
  colors,
  initialBusinessContext = "default",
  children,
}: {
  colors: HeaderColorConfig;
  initialBusinessContext?: SiteBusinessContext;
  children: ReactNode;
}) {
  const businessContext = useSiteBusinessContext(initialBusinessContext);
  const bandColors = headerColorsForBusinessContext(businessContext, colors);
  const style = headerBandColorsToCssVars(bandColors) as CSSProperties;

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
      <header className="sticky top-0 z-40" style={style}>
        {children}
      </header>
    </HeaderCompactContext.Provider>
  );
}
