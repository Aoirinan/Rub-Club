"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  readBusinessContextCookie,
  resolveBusinessContext,
  type SiteBusinessContext,
} from "@/lib/site-business-context";

/** Resolve live business context from pathname + cookie (client navigation). */
export function useSiteBusinessContext(
  initialContext: SiteBusinessContext = "default",
): SiteBusinessContext {
  const pathname = usePathname() ?? "/";
  return useMemo(() => {
    const fromPath = resolveBusinessContext(pathname, readBusinessContextCookie());
    if (fromPath !== "default") return fromPath;
    return initialContext !== "default" ? initialContext : "default";
  }, [pathname, initialContext]);
}
