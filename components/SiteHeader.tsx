import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import {
  businessNavItemsToNavItems,
  getBusinessNavigationConfig,
} from "@/lib/business-nav";
import type { HeaderBrandContent } from "@/lib/brand-logos";
import type { LocationInfo } from "@/lib/constants";
import type { HeaderColorConfig } from "@/lib/header-colors";
import type { SiteBusinessContext } from "@/lib/site-business-context";

export async function SiteHeader({
  paris,
  sulphur,
  giftCardHref,
  showTopPhoneBar = true,
  headerBranding,
  headerColors,
  initialBusinessContext = "default",
}: {
  paris: LocationInfo;
  sulphur: LocationInfo;
  giftCardHref: string;
  showTopPhoneBar?: boolean;
  headerBranding?: HeaderBrandContent;
  headerColors: HeaderColorConfig;
  initialBusinessContext?: SiteBusinessContext;
}) {
  const navConfig = await getBusinessNavigationConfig();
  const parisChiroNavItems = businessNavItemsToNavItems(navConfig.parisChiro, giftCardHref);
  const sulphurSpringsNavItems = businessNavItemsToNavItems(
    navConfig.sulphurSprings,
    giftCardHref,
  );

  return (
    <SiteHeaderClient
      paris={paris}
      sulphur={sulphur}
      giftCardHref={giftCardHref}
      showTopPhoneBar={showTopPhoneBar}
      headerBranding={headerBranding}
      headerColors={headerColors}
      initialBusinessContext={initialBusinessContext}
      parisChiroNavItems={parisChiroNavItems}
      sulphurSpringsNavItems={sulphurSpringsNavItems}
    />
  );
}
