import { GIFT_CARD_ORDER_URL } from "@/lib/constants";
import type { BusinessNavItem, BusinessNavigationConfig } from "@/lib/site-owner-config";

export const DEFAULT_PARIS_CHIRO_NAV: BusinessNavItem[] = [
  { label: "Home", href: "/services/chiropractic" },
  {
    label: "About Us",
    href: "/locations/paris",
    children: [
      { label: "Meet The Staff", href: "/locations/paris/staff" },
      { label: "Office & Hours", href: "/locations/paris" },
    ],
  },
  {
    label: "Services",
    href: "/services/chiropractic",
    children: [
      {
        label: "Wellness care plans",
        href: "/services/chiropractic/wellness-care-plans",
      },
    ],
  },
  {
    label: "Patient Resources",
    href: "/patient-forms",
    children: [
      { label: "Patient forms & intake", href: "/patient-forms" },
      { label: "Q & A", href: "/faq" },
    ],
  },
  { label: "Gift cards", href: GIFT_CARD_ORDER_URL, external: true },
  { label: "Contact", href: "/contact" },
  { label: "Book Now", href: "/book?service=chiropractic&location=paris" },
];

export const DEFAULT_SULPHUR_SPRINGS_NAV: BusinessNavItem[] = [
  { label: "Home", href: "/sulphur-springs" },
  {
    label: "About Us",
    href: "/sulphur-springs/staff",
    children: [{ label: "Meet The Staff", href: "/sulphur-springs/staff" }],
  },
  {
    label: "Services",
    href: "/sulphur-springs",
    children: [
      {
        label: "Common Conditions",
        href: "/sulphur-springs/common-chiropractic-conditions",
      },
      {
        label: "Adjustments",
        href: "/sulphur-springs/adjustments-and-manipulation",
      },
      { label: "Auto Injury", href: "/sulphur-springs/auto-injury" },
      { label: "Personal Injury", href: "/sulphur-springs/personal-injury" },
      { label: "Sports Injury", href: "/sulphur-springs/sports-injury" },
    ],
  },
  {
    label: "Patient Resources",
    href: "/sulphur-springs/patient-resources",
    children: [
      { label: "About Chiropractic", href: "/sulphur-springs/patient-resources" },
      { label: "Q & A", href: "/sulphur-springs/q-and-a" },
      { label: "Patient forms & intake", href: "/patient-forms" },
    ],
  },
  { label: "Gift cards", href: GIFT_CARD_ORDER_URL, external: true },
  { label: "Contact", href: "/contact" },
  {
    label: "Appointment Request",
    href: "/book?service=chiropractic&location=sulphur_springs",
  },
];

export const DEFAULT_BUSINESS_NAVIGATION: BusinessNavigationConfig = {
  parisChiro: DEFAULT_PARIS_CHIRO_NAV,
  sulphurSprings: DEFAULT_SULPHUR_SPRINGS_NAV,
};

function isValidNavItem(item: unknown): item is BusinessNavItem {
  if (!item || typeof item !== "object") return false;
  const o = item as Record<string, unknown>;
  if (typeof o.label !== "string" || !o.label.trim()) return false;
  if (typeof o.href !== "string" || !o.href.trim()) return false;
  if (o.external !== undefined && typeof o.external !== "boolean") return false;
  if (o.children !== undefined) {
    if (!Array.isArray(o.children)) return false;
    for (const c of o.children) {
      if (!c || typeof c !== "object") return false;
      const child = c as Record<string, unknown>;
      if (typeof child.label !== "string" || !child.label.trim()) return false;
      if (typeof child.href !== "string" || !child.href.trim()) return false;
    }
  }
  return true;
}

export function sanitizeBusinessNavItems(raw: unknown): BusinessNavItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const items: BusinessNavItem[] = [];
  for (const entry of raw) {
    if (!isValidNavItem(entry)) return null;
    items.push({
      label: entry.label.trim(),
      href: entry.href.trim(),
      external: entry.external === true,
      children: entry.children?.map((c) => ({
        label: c.label.trim(),
        href: c.href.trim(),
      })),
    });
  }
  return items;
}

export function mergeBusinessNavigationConfig(
  partial: Partial<BusinessNavigationConfig> | undefined,
): BusinessNavigationConfig {
  const paris = sanitizeBusinessNavItems(partial?.parisChiro);
  const ss = sanitizeBusinessNavItems(partial?.sulphurSprings);
  return {
    parisChiro: paris ?? [...DEFAULT_PARIS_CHIRO_NAV],
    sulphurSprings: ss ?? [...DEFAULT_SULPHUR_SPRINGS_NAV],
  };
}
