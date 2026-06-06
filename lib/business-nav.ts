import type { NavItem } from "@/components/DesktopNav";
import {
  DEFAULT_BUSINESS_NAVIGATION,
  mergeBusinessNavigationConfig,
} from "@/lib/business-nav-defaults";
import type { SiteBusinessContext } from "@/lib/site-business-context";
import {
  getSiteOwnerConfig,
  type BusinessNavItem,
  type BusinessNavigationConfig,
} from "@/lib/site-owner-config";
import { effectiveGiftCardUrl } from "@/lib/site-display-overrides";
import { getContentMany } from "@/lib/cms";

export { mergeBusinessNavigationConfig, sanitizeBusinessNavItems } from "@/lib/business-nav-defaults";

export function businessNavForContext(
  config: BusinessNavigationConfig,
  context: SiteBusinessContext,
): BusinessNavItem[] {
  if (context === "paris_chiro") return config.parisChiro;
  if (context === "sulphur_springs") return config.sulphurSprings;
  return [];
}

export function businessNavItemsToNavItems(
  items: BusinessNavItem[],
  giftCardHref: string,
): NavItem[] {
  return items.map((item) => {
    const href =
      item.label === "Gift cards" && item.external
        ? giftCardHref || item.href
        : item.href;
    return {
      href,
      label: item.label,
      external: item.external,
      children: item.children?.map((c) => ({ href: c.href, label: c.label })),
    };
  });
}

export async function getBusinessNavigationConfig(): Promise<BusinessNavigationConfig> {
  try {
    const cfg = await getSiteOwnerConfig();
    return mergeBusinessNavigationConfig(cfg.businessNavigation);
  } catch {
    return { ...DEFAULT_BUSINESS_NAVIGATION };
  }
}

export async function getResolvedBusinessNavItems(
  context: SiteBusinessContext,
): Promise<NavItem[]> {
  if (context === "default") return [];
  const [config, cms] = await Promise.all([
    getBusinessNavigationConfig(),
    getContentMany(["nav_giftcard_url"]),
  ]);
  const giftCardHref = effectiveGiftCardUrl(undefined, cms);
  const items = businessNavForContext(config, context);
  return businessNavItemsToNavItems(items, giftCardHref);
}
