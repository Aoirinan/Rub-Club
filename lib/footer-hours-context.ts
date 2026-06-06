import type { DomainContextValue } from "@/lib/domain-context";
import type { SiteBusinessContext } from "@/lib/site-business-context";

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
  businessCtx: SiteBusinessContext = "default",
): FooterHoursFocus {
  const fromPath = footerHoursFocusFromPathname(pathname);
  if (fromPath) return fromPath;
  if (businessCtx === "paris_chiro") return "paris";
  if (businessCtx === "sulphur_springs") return "sulphur_springs";
  if (domainCtx === "massage") return "paris";
  if (domainCtx === "chiro") return "sulphur_springs";
  return "both";
}
