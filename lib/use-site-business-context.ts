"use client";

import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
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

// The cookie has no change event; navigations re-render through `pathname`.
const subscribeNoop = () => () => {};

/** Resolve live business context from pathname + cookie (client navigation). */
export function useSiteBusinessContext(
  initialContext: SiteBusinessContext = "default",
): SiteBusinessContext {
  const pathname = usePathname() ?? "/";
  // Hydration must render exactly what the server did, so the first client
  // render uses the server's context (getServerSnapshot) and the live cookie is
  // read right after. Reading document.cookie during hydration made a shared
  // page throw a hydration mismatch (React #418) whenever the cookie changed
  // between the server render and hydration, e.g. another tab switching office.
  const cookieContext = useSyncExternalStore(
    subscribeNoop,
    readBusinessContextCookie,
    () => initialContext,
  );
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

    const resolved = resolveBusinessContext(pathname, cookieContext);
    if (resolved !== "default") {
      clearLegacyStickyBusinessContext();
      return resolved;
    }

    clearLegacyStickyBusinessContext();

    // Shared page with no cookie: keep the server-provided context — must match
    // getPageBrand() on the server.
    if (initialContext !== "default") return initialContext;
    return "default";
  }, [pathname, cookieContext, initialContext]);
}
