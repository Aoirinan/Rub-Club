import type { DomainContextValue } from "@/lib/domain-context";

export type FooterHoursFocus = "paris" | "sulphur_springs" | "both";

/** Path-based footer hours focus; null when the page is location-neutral. */
export function footerHoursFocusFromPathname(pathname: string): FooterHoursFocus | null {
  const p = pathname.split("?")[0] ?? "/";
  if (p.startsWith("/services/massage")) return "paris";
  if (p.startsWith("/services/chiropractic") || p.startsWith("/locations/paris")) {
    return "paris";
  }
  if (p.startsWith("/sulphur-springs") || p.startsWith("/locations/sulphur-springs")) {
    return "sulphur_springs";
  }
  return null;
}

export function footerHoursFocus(
  pathname: string,
  domainCtx: DomainContextValue,
): FooterHoursFocus {
  const fromPath = footerHoursFocusFromPathname(pathname);
  if (fromPath) return fromPath;
  if (domainCtx === "massage") return "paris";
  if (domainCtx === "chiro") return "sulphur_springs";
  return "both";
}
