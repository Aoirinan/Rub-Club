import { SiteHeaderClient, type ServicesNavChild } from "@/components/SiteHeaderClient";
import type { HeaderBrandContent } from "@/lib/brand-logos";
import { getContent } from "@/lib/cms";
import type { LocationInfo } from "@/lib/constants";
import type { HeaderColorConfig } from "@/lib/header-colors";
import { buildParisChiroNavChildren } from "@/lib/paris-chiro-services";
import type { SiteBusinessContext } from "@/lib/site-business-context";
import { SS_SERVICES } from "@/lib/sulphur-springs-content";

const SS_SERVICES_NAV_CHILDREN: ServicesNavChild[] = SS_SERVICES.map((s) => ({
  href: `/sulphur-springs/${s.slug}`,
  label: s.title,
}));

/** Wellness Plan dropdown items for the Sulphur Springs section of the site. */
const SS_WELLNESS_NAV_CHILDREN: ServicesNavChild[] = [
  { href: "/sulphur-springs/wellness-care-plans", label: "Wellness Plan" },
  { href: "/sulphur-springs/massage/prices", label: "Massage Prices" },
];

const PARIS_SERVICES_NAV_CHILDREN: ServicesNavChild[] = buildParisChiroNavChildren();

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
  const staffNavLabel =
    (await getContent("nav_staff_label"))?.trim() || "About Us";
  return (
    <SiteHeaderClient
      paris={paris}
      sulphur={sulphur}
      giftCardHref={giftCardHref}
      showTopPhoneBar={showTopPhoneBar}
      headerBranding={headerBranding}
      headerColors={headerColors}
      initialBusinessContext={initialBusinessContext}
      servicesNavChildren={PARIS_SERVICES_NAV_CHILDREN}
      ssServicesNavChildren={SS_SERVICES_NAV_CHILDREN}
      ssWellnessNavChildren={SS_WELLNESS_NAV_CHILDREN}
      staffNavLabel={staffNavLabel}
    />
  );
}
