"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  businessContextFromPathname,
  isSharedPathname,
  readBusinessContextCookie,
  resolveBusinessContext,
  type SiteBusinessContext,
} from "@/lib/site-business-context";

/** One-time cleanup for a retired sessionStorage fallback that caused header/page mismatches. */
function clearLegacyStickyBusinessContext(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem("rub_business_ctx_sticky");
  } catch {
    /* private browsing / blocked storage */
  }
}

/** Resolve live business context from pathname + cookie (client navigation). */
export function useSiteBusinessContext(
  initialContext: SiteBusinessContext = "default",
): SiteBusinessContext {
  const pathname = usePathname() ?? "/";
  return useMemo(() => {
    const fromPath = businessContextFromPathname(pathname);
    if (fromPath !== "default") {
      clearLegacyStickyBusinessContext();
      return fromPath;
    }

    if (!isSharedPathname(pathname)) {
      clearLegacyStickyBusinessContext();
      return "default";
    }

    const resolved = resolveBusinessContext(pathname, readBusinessContextCookie());
    if (resolved !== "default") {
      clearLegacyStickyBusinessContext();
      return resolved;
    }

    clearLegacyStickyBusinessContext();

    // During SSR/hydration the cookie isn't readable; trust the server-provided
    // context on shared pages only — must match getPageBrand() on the server.
    if (initialContext !== "default") return initialContext;
    return "default";
  }, [pathname, initialContext]);
}
