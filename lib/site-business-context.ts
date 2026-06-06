export const BUSINESS_CTX_COOKIE = "rub_business_ctx";

export type SiteBusinessContext = "default" | "paris_chiro" | "sulphur_springs";

const VALID: SiteBusinessContext[] = ["default", "paris_chiro", "sulphur_springs"];

/** Normalize cookie / server value to a known business context. */
export function parseBusinessContextValue(raw: string | undefined | null): SiteBusinessContext {
  const v = raw?.trim() ?? "";
  if (VALID.includes(v as SiteBusinessContext)) return v as SiteBusinessContext;
  return "default";
}

/** Derive business context from URL pathname (ignores query string). */
export function businessContextFromPathname(pathname: string): SiteBusinessContext {
  const p = pathname.split("?")[0] ?? "/";
  if (p.startsWith("/sulphur-springs") || p.startsWith("/locations/sulphur-springs")) {
    return "sulphur_springs";
  }
  if (p.startsWith("/services/chiropractic") || p.startsWith("/locations/paris")) {
    return "paris_chiro";
  }
  return "default";
}

/**
 * Resolve effective business context: pathname wins when on a business route;
 * otherwise fall back to cookie (for shared pages like /contact, /patient-forms).
 */
export function resolveBusinessContext(
  pathname: string,
  cookieValue: string | undefined | null,
): SiteBusinessContext {
  const fromPath = businessContextFromPathname(pathname);
  if (fromPath !== "default") return fromPath;
  return parseBusinessContextValue(cookieValue);
}

/** Read `rub_business_ctx` in the browser (client components only). */
export function readBusinessContextCookie(): SiteBusinessContext {
  if (typeof document === "undefined") return "default";
  const m = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${BUSINESS_CTX_COOKIE}=([^;]+)`),
  );
  const v = m?.[1] ? decodeURIComponent(m[1]) : "";
  return parseBusinessContextValue(v);
}

/** Cookie value to set in middleware when entering a business route. */
export function businessContextCookieValue(pathname: string): SiteBusinessContext | null {
  const ctx = businessContextFromPathname(pathname);
  return ctx === "default" ? null : ctx;
}
