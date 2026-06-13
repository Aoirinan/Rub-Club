import { SiteHeaderClient, type ServicesNavChild } from "@/components/SiteHeaderClient";
import type { HeaderBrandContent } from "@/lib/brand-logos";
import { getContent } from "@/lib/cms";
import { parseChiroTreatments } from "@/lib/chiro-treatments";
import type { LocationInfo } from "@/lib/constants";
import type { HeaderColorConfig } from "@/lib/header-colors";
import { parisChiroServiceSlugForName } from "@/lib/paris-chiro-services";
import type { SiteBusinessContext } from "@/lib/site-business-context";
import { SS_SERVICES } from "@/lib/sulphur-springs-content";

/** Services dropdown items for the Sulphur Springs section of the site. */
const SS_SERVICES_NAV_CHILDREN: ServicesNavChild[] = SS_SERVICES.map((s) => ({
  href: `/sulphur-springs/${s.slug}`,
  label: s.title,
}));

/** Wellness Plan dropdown items for the Sulphur Springs section of the site. */
const SS_WELLNESS_NAV_CHILDREN: ServicesNavChild[] = [
  { href: "/sulphur-springs/wellness-care-plans", label: "Wellness Plan" },
  { href: "/sulphur-springs/massage/prices", label: "Massage Prices" },
];

/** Services dropdown items from the manager-edited treatments list (CMS). */
async function getServicesNavChildren(): Promise<ServicesNavChild[] | undefined> {
  try {
    const value = await getContent("chiro_treatments_list");
    const treatments = parseChiroTreatments(value ?? "");
    if (!treatments.length) return undefined;
    return treatments.map((t) => {
      const slug = parisChiroServiceSlugForName(t.name);
      return {
        href: slug ? `/services/chiropractic/${slug}` : "/services/chiropractic",
        label: t.name,
      };
    });
  } catch {
    return undefined;
  }
}

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
  const servicesNavChildren = await getServicesNavChildren();
  return (
    <SiteHeaderClient
      paris={paris}
      sulphur={sulphur}
      giftCardHref={giftCardHref}
      showTopPhoneBar={showTopPhoneBar}
      headerBranding={headerBranding}
      headerColors={headerColors}
      initialBusinessContext={initialBusinessContext}
      servicesNavChildren={servicesNavChildren}
      ssServicesNavChildren={SS_SERVICES_NAV_CHILDREN}
      ssWellnessNavChildren={SS_WELLNESS_NAV_CHILDREN}
    />
  );
}
