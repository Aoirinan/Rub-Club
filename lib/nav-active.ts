import type { NavItem, NavItemKey } from "@/components/DesktopNav";
import type { SiteBusinessContext } from "@/lib/site-business-context";

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/$/, "");
  return trimmed || "/";
}

/**
 * Pick exactly one primary nav section for the current path.
 * Home is handled separately (exact href match only).
 */
function primaryNavActiveKey(
  pathname: string,
  businessContext: SiteBusinessContext,
): NavItemKey | null {
  const path = normalizePath(pathname);

  if (path.startsWith("/patient-forms") || path.startsWith("/sulphur-springs/patient-forms")) {
    return "patient-forms";
  }

  if (
    path.startsWith("/services/chiropractic/wellness-care-plans") ||
    path.startsWith("/sulphur-springs/wellness-care-plans") ||
    path.startsWith("/services/massage/prices") ||
    path.startsWith("/sulphur-springs/massage/prices")
  ) {
    return "wellness";
  }

  if (
    path.startsWith("/locations/paris/staff") ||
    path.startsWith("/sulphur-springs/staff") ||
    path === "/about"
  ) {
    return "about";
  }

  if (
    path === "/contact" ||
    path.startsWith("/sulphur-springs/contact") ||
    (path.startsWith("/locations/") && !path.includes("/staff"))
  ) {
    return "contact";
  }

  if (path.startsWith("/services/massage") || path.startsWith("/sulphur-springs/massage")) {
    return "massage";
  }

  if (path.startsWith("/services/chiropractic")) {
    return "chiropractic";
  }

  if (path.startsWith("/services/")) {
    return "services";
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
      "insurance",
      "reviews",
      "patient-forms",
    ]);
    if (nonService.has(segment)) return null;
    return businessContext === "sulphur_springs" ? "services" : "chiropractic";
  }

  return null;
}

/** Items built without a `key` (older callers) fall back to their default label. */
function keyFromLegacyLabel(item: NavItem): NavItemKey | null {
  switch (item.label) {
    case "Home":
      return "home";
    case "Services":
      return "services";
    case "Chiropractic":
      return "chiropractic";
    case "Massage":
      return "massage";
    case "About Us":
    case "Staff":
      return "about";
    case "Wellness Plan":
      return "wellness";
    case "Gift cards":
      return "giftcards";
    case "Patient Forms":
      return "patient-forms";
    case "Contact Us":
      return "contact";
    default:
      return null;
  }
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

  const itemKey = item.key ?? keyFromLegacyLabel(item);
  if (itemKey === "home") {
    return path === normalizePath(item.href);
  }

  const active = primaryNavActiveKey(pathname, businessContext);
  if (!active) return false;

  if (active === "about") {
    // Labels are CMS-editable, so match on where the item points as well.
    const href = normalizePath(item.href);
    return (
      itemKey === "about" ||
      href === "/locations/paris/staff" ||
      href === "/sulphur-springs/staff" ||
      href === "/about"
    );
  }

  return itemKey === active;
}
