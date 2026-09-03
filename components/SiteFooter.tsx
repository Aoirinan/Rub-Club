import { SiteFooterClient, type FooterText } from "@/components/SiteFooterClient";
import type { DomainContextValue } from "@/lib/domain-context";
import type { OfficeHoursRow } from "@/lib/office-hours";
import type { LocationInfo } from "@/lib/constants";
import type { SiteBusinessContext } from "@/lib/site-business-context";
import { getUiText } from "@/lib/ui-text";

export async function SiteFooter({
  locations,
  giftCardHref,
  footerBlurbHtml,
  footerTagline,
  footerCopyright,
  footerLinks,
  parisChiroHours,
  parisMassageHours,
  sulphurHours,
  initialDomainCtx,
  initialBusinessContext = "default",
}: {
  locations?: readonly LocationInfo[];
  giftCardHref?: string;
  footerBlurbHtml?: string | null;
  footerTagline?: string | null;
  footerCopyright?: string | null;
  /** Raw CMS "Label — /path" link lists per business context. */
  footerLinks?: Partial<Record<SiteBusinessContext, string | undefined>>;
  parisChiroHours: readonly OfficeHoursRow[];
  parisMassageHours: readonly OfficeHoursRow[];
  sulphurHours: readonly OfficeHoursRow[];
  initialDomainCtx: DomainContextValue;
  initialBusinessContext?: SiteBusinessContext;
}) {
  const ui = await getUiText();
  const text: FooterText = {
    allPractices: ui.ui_all_practices,
    massageDesk: ui.ui_massage_desk_label,
    explore: ui.ui_explore,
    giftCardsSquare: ui.ui_gift_cards_square,
    privacyPractices: ui.ui_privacy_practices,
    websitePrivacy: ui.ui_website_privacy,
    terms: ui.ui_terms,
    staff: ui.ui_staff_link,
    hours: ui.ui_hours,
    hoursColChiro: ui.ui_hours_col_chiro,
    hoursColMassage: ui.ui_hours_col_massage,
    hoursEmpty: ui.ui_hours_empty,
    bookNow: ui.ui_book_now,
  };
  return (
    <SiteFooterClient
      locations={locations}
      giftCardHref={giftCardHref}
      footerBlurbHtml={footerBlurbHtml}
      footerTagline={footerTagline}
      footerCopyright={footerCopyright}
      footerLinks={footerLinks}
      parisChiroHours={parisChiroHours}
      parisMassageHours={parisMassageHours}
      sulphurHours={sulphurHours}
      initialDomainCtx={initialDomainCtx}
      initialBusinessContext={initialBusinessContext}
      text={text}
    />
  );
}
