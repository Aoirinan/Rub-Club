"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  headerBandColorsToCssVars,
  headerColorsForBusinessContext,
  type HeaderColorConfig,
} from "@/lib/header-colors";
import type { SiteBusinessContext } from "@/lib/site-business-context";
import { useSiteBusinessContext } from "@/lib/use-site-business-context";

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

  return (
    <header className="sticky top-0 z-40" style={style}>
      {children}
    </header>
  );
}
