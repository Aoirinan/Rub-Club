import type { BrandLogoVariant } from "@/lib/brand-logos";

/** Pick which brand is centered/large in the header from the current URL. */
export function brandVariantFromPathname(pathname: string): BrandLogoVariant {
  const p = pathname.split("?")[0] ?? "/";
  if (p.startsWith("/services/massage")) return "massage";
  if (p.startsWith("/services/chiropractic")) return "chiropractic";
  if (p.startsWith("/sulphur-springs") || p.startsWith("/locations/sulphur-springs")) {
    return "sulphur-springs";
  }
  return "home";
}
