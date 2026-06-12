import { SiteHeaderClient, type ServicesNavChild } from "@/components/SiteHeaderClient";
import type { HeaderBrandContent } from "@/lib/brand-logos";
import { getContent } from "@/lib/cms";
import { parseChiroTreatments } from "@/lib/chiro-treatments";
import type { LocationInfo } from "@/lib/constants";
import type { HeaderColorConfig } from "@/lib/header-colors";
import { parisChiroServiceSlugForName } from "@/lib/paris-chiro-services";
import type { SiteBusinessContext } from "@/lib/site-business-context";

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
    />
  );
}
