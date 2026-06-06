import { SiteFooterClient } from "@/components/SiteFooterClient";
import type { DomainContextValue } from "@/lib/domain-context";
import type { OfficeHoursRow } from "@/lib/office-hours";
import type { LocationInfo } from "@/lib/constants";
import type { SiteBusinessContext } from "@/lib/site-business-context";

export function SiteFooter({
  locations,
  giftCardHref,
  footerBlurbHtml,
  footerTagline,
  footerCopyright,
  parisHours,
  sulphurHours,
  initialDomainCtx,
  initialBusinessContext = "default",
}: {
  locations?: readonly LocationInfo[];
  giftCardHref?: string;
  footerBlurbHtml?: string | null;
  footerTagline?: string | null;
  footerCopyright?: string | null;
  parisHours: readonly OfficeHoursRow[];
  sulphurHours: readonly OfficeHoursRow[];
  initialDomainCtx: DomainContextValue;
  initialBusinessContext?: SiteBusinessContext;
}) {
  return (
    <SiteFooterClient
      locations={locations}
      giftCardHref={giftCardHref}
      footerBlurbHtml={footerBlurbHtml}
      footerTagline={footerTagline}
      footerCopyright={footerCopyright}
      parisHours={parisHours}
      sulphurHours={sulphurHours}
      initialDomainCtx={initialDomainCtx}
      initialBusinessContext={initialBusinessContext}
    />
  );
}
