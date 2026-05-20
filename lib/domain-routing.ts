/**
 * Host-based entry redirects for legacy marketing domains (see docs/client-handout).
 */

const MASSAGE_HOSTS = new Set(["massageparistexas.com", "www.massageparistexas.com"]);
const SULPHUR_CHIRO_HOSTS = new Set([
  "chiropracticsulphursprings.com",
  "www.chiropracticsulphursprings.com",
]);

const SKIP_PREFIXES = ["/api", "/admin", "/_next", "/superadmin"];

export function domainEntryRedirectPath(host: string, pathname: string): string | null {
  const h = host.toLowerCase();
  if (!pathname || pathname === "/") {
    if (MASSAGE_HOSTS.has(h)) return "/services/massage";
    if (SULPHUR_CHIRO_HOSTS.has(h)) return "/sulphur-springs";
  }
  return null;
}

export function shouldSkipDomainRedirect(pathname: string): boolean {
  return SKIP_PREFIXES.some((p) => pathname.startsWith(p));
}
