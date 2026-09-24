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
  "/contact",
  "/book",
  "/faq",
  "/about",
  "/privacy",
  "/terms",
  "/website-privacy",
  "/auth",
  "/patient-forms",
  "/reviews",
  // Single pages with one URL but relevant to both sites — keep the visitor's
  // current brand color instead of forcing Paris.
  "/services/chiropractic/wellness-care-plans",
  "/services/massage/prices",
  // Staff pages (sign-in, scheduler) are reached from either site's footer:
  // keep the visitor's brand rather than snapping back to Paris.
  "/admin",
  "/superadmin",
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

/**
 * The booking page opened for the Sulphur Springs office
 * (`/book?location=sulphur_springs`: the SS "Book Now" links and the old
 * chiropracticsulphursprings.com appointment URLs). /book is a shared page and
 * normally keeps the visitor's current brand, but a first-time visitor from the
 * old SS domain has no brand cookie yet and would see the Paris office — so the
 * office named in the URL decides. Every other /book URL is left to the cookie.
 * Accepts the same `location` spellings as the booking wizard.
 */
export function bookingPageBusinessContext(
  pathname: string,
  search: URLSearchParams | string,
): SiteBusinessContext | null {
  const p = pathname.split("?")[0] ?? "/";
  if (p !== "/book") return null;
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const location = params.get("location");
  return location === "sulphur_springs" || location === "sulphur-springs"
    ? "sulphur_springs"
    : null;
}

/**
 * Cookie value to set in middleware when entering a business route, or the
 * booking page opened for Sulphur Springs (pass the query string for that).
 */
export function businessContextCookieValue(
  pathname: string,
  search?: URLSearchParams | string,
): SiteBusinessContext | null {
  const ctx = businessContextFromPathname(pathname);
  if (ctx !== "default") return ctx;
  return search === undefined ? null : bookingPageBusinessContext(pathname, search);
}
