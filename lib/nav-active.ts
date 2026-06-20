import type { NavItem } from "@/components/DesktopNav";
import type { SiteBusinessContext } from "@/lib/site-business-context";

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/$/, "");
  return trimmed || "/";
}

/**
 * Pick exactly one primary nav label for the current path.
 * Home is handled separately (exact href match only).
 */
function primaryNavActiveLabel(
  pathname: string,
  businessContext: SiteBusinessContext,
): string | null {
  const path = normalizePath(pathname);

  if (path.startsWith("/patient-forms")) return "Patient Forms";

  if (
    path.startsWith("/services/chiropractic/wellness-care-plans") ||
    path.startsWith("/sulphur-springs/wellness-care-plans") ||
    path.startsWith("/services/massage/prices") ||
    path.startsWith("/sulphur-springs/massage/prices")
  ) {
    return "Wellness Plan";
  }

  if (
    path.startsWith("/locations/paris/staff") ||
    path.startsWith("/sulphur-springs/staff") ||
    path === "/about"
  ) {
    return "About Us";
  }

  if (
    path === "/contact" ||
    path.startsWith("/sulphur-springs/contact") ||
    (path.startsWith("/locations/") && !path.includes("/staff"))
  ) {
    return "Contact Us";
  }

  if (path.startsWith("/services/massage") || path.startsWith("/sulphur-springs/massage")) {
    return "Massage";
  }

  if (path.startsWith("/services/chiropractic")) {
    return "Chiropractic";
  }

  if (path.startsWith("/services/")) {
    return "Services";
  }

  if (path.startsWith("/sulphur-springs")) {
    const segment = path.slice("/sulphur-springs".length).split("/").filter(Boolean)[0] ?? "";
    if (!segment) return null;
    const nonService = new Set([
      "staff",
      "contact",
      "patient-resources",
      "q-and-a",
      "massage",
      "wellness-care-plans",
    ]);
    if (nonService.has(segment)) return null;
    return businessContext === "sulphur_springs" ? "Services" : "Chiropractic";
  }

  return null;
}

/**
 * Whether a primary nav item should show the active/highlight state.
 * Only one section highlights at a time; Home matches its href exactly.
 */
export function isNavItemActive(
  item: NavItem,
  pathname: string,
  businessContext: SiteBusinessContext = "default",
): boolean {
  const path = normalizePath(pathname);

  if (item.label === "Home") {
    return path === normalizePath(item.href);
  }

  const active = primaryNavActiveLabel(pathname, businessContext);
  if (!active) return false;

  if (active === "About Us") {
    return item.label === "About Us" || item.label === "Staff";
  }

  return item.label === active;
}
