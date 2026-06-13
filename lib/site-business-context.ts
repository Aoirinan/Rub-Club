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
  // Shared single pages (reachable from both sites) must not be classified as a
  // business route, so the visitor's current site context (cookie) is kept.
  if (isSharedPathname(p)) return "default";
  if (p.startsWith("/sulphur-springs") || p.startsWith("/locations/sulphur-springs")) {
    return "sulphur_springs";
  }
  if (p.startsWith("/services/chiropractic") || p.startsWith("/locations/paris")) {
    return "paris_chiro";
  }
  return "default";
}

/**
 * Pages that exist once but are reachable from both "sites" (Paris and
 * Sulphur Springs). On these, the header keeps the brand color of the site
 * the visitor came from (cookie). Everything else that isn't a business
 * route belongs to the Paris site and resets the context.
 */
const SHARED_PATH_PREFIXES = [
  "/patient-forms",
  "/contact",
  "/book",
  "/faq",
  "/insurance",
  "/reviews",
  "/about",
  "/privacy",
  "/terms",
  "/website-privacy",
  "/auth",
  // Single pages with one URL but relevant to both sites — keep the visitor's
  // current brand color instead of forcing Paris.
  "/services/chiropractic/wellness-care-plans",
  "/services/massage/prices",
] as const;

export function isSharedPathname(pathname: string): boolean {
  const p = pathname.split("?")[0] ?? "/";
  return SHARED_PATH_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  );
}

/**
 * Resolve effective business context:
 * - business route → context from pathname;
 * - shared page (contact, patient forms, booking, …) → sticky cookie value;
 * - anything else (home, massage, …) is a Paris-site page → default.
 */
export function resolveBusinessContext(
  pathname: string,
  cookieValue: string | undefined | null,
): SiteBusinessContext {
  const fromPath = businessContextFromPathname(pathname);
  if (fromPath !== "default") return fromPath;
  if (isSharedPathname(pathname)) return parseBusinessContextValue(cookieValue);
  return "default";
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
