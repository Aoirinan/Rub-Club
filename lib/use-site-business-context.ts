"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  isSharedPathname,
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
    const resolved = resolveBusinessContext(pathname, readBusinessContextCookie());
    if (resolved !== "default") return resolved;
    // During SSR/hydration the cookie isn't readable; trust the server-provided
    // context, but only on shared pages — Paris-site pages always reset.
    if (isSharedPathname(pathname) && initialContext !== "default") {
      return initialContext;
    }
    return "default";
  }, [pathname, initialContext]);
}
