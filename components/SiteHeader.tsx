import { cache } from "react";
import { SiteHeaderClient, type ServicesNavChild } from "@/components/SiteHeaderClient";
import type { NavChrome } from "@/components/NavChromeContext";
import type { HeaderBrandContent } from "@/lib/brand-logos";
import { getContentMany } from "@/lib/cms";
import type { LocationInfo } from "@/lib/constants";
import type { HeaderColorConfig } from "@/lib/header-colors";
import { massageServiceNameId } from "@/lib/massage-page-cms";
import { NAV_TEXT_KEYS, resolveNavText, type NavText } from "@/lib/nav-cms";
import { buildParisChiroNavChildren } from "@/lib/paris-chiro-services";
import { parisChiroPageNavLabelId } from "@/lib/paris-chiro-cms-registry";
import type { SiteBusinessContext } from "@/lib/site-business-context";
import { ssPageNavLabelId } from "@/lib/ss-cms-registry";
import { buildSSChiroNavChildren } from "@/lib/sulphur-springs-content";
import { getUiText } from "@/lib/ui-text";

const SS_SERVICES_NAV_CHILDREN: ServicesNavChild[] = buildSSChiroNavChildren();
const PARIS_SERVICES_NAV_CHILDREN: ServicesNavChild[] = buildParisChiroNavChildren();

/** CMS field that holds the menu label for a Services-menu link, if any. */
function navLabelFieldFor(href: string): string | null {
  const slug = href.split("/").pop() ?? "";
  if (href.startsWith("/services/chiropractic/")) return parisChiroPageNavLabelId(slug);
  if (href.startsWith("/services/massage/")) return massageServiceNameId(slug);
  if (href === "/sulphur-springs/massage") return "nav_ss_massage_therapy_label";
  if (href.startsWith("/sulphur-springs/")) return ssPageNavLabelId(slug);
  return null;
}

/** Static group heading → editable group heading. */
function groupLabel(group: string | undefined, nav: NavText): string | undefined {
  switch (group) {
    case "Injuries":
      return nav.nav_group_injuries;
    case "Therapeutic Massage":
      return nav.nav_group_therapeutic_massage;
    case "Cryotherapy":
      return nav.nav_group_cryotherapy;
    case "Electrical Stimulation":
      return nav.nav_group_electrical_stimulation;
    case "Chiropractic Services":
      return nav.nav_group_chiropractic_services;
    default:
      return group;
  }
}

function applyMenuLabels(
  children: ServicesNavChild[],
  cms: Partial<Record<string, string>>,
  nav: NavText,
): ServicesNavChild[] {
  return children.map((c) => {
    const fieldId = navLabelFieldFor(c.href);
    const override = fieldId ? cms[fieldId]?.trim() : "";
    return {
      href: c.href,
      label: override || c.label,
      ...(c.group ? { group: groupLabel(c.group, nav) } : {}),
    };
  });
}

/**
 * Menu labels + chrome strings, resolved once per request so a second header
 * instance (or a page that renders its own) costs nothing extra.
 */
const getNavMenuData = cache(async function getNavMenuData() {
  const serviceLabelIds = [...PARIS_SERVICES_NAV_CHILDREN, ...SS_SERVICES_NAV_CHILDREN]
    .map((c) => navLabelFieldFor(c.href))
    .filter((id): id is string => Boolean(id));
  const [cms, ui] = await Promise.all([
    getContentMany([...NAV_TEXT_KEYS, "nav_staff_label", ...serviceLabelIds]),
    getUiText(),
  ]);
  const nav = resolveNavText(cms);
  return {
    nav,
    staffNavLabel: cms.nav_staff_label?.trim() || "About Us",
    chrome: {
      nav,
      bookNow: ui.ui_book_now,
      getDirections: ui.ui_get_directions,
      faxLabel: ui.ui_fax_label,
    } satisfies NavChrome,
    parisServices: applyMenuLabels(PARIS_SERVICES_NAV_CHILDREN, cms, nav),
    ssServices: applyMenuLabels(SS_SERVICES_NAV_CHILDREN, cms, nav),
  };
});

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
  const { nav, staffNavLabel, chrome, parisServices, ssServices } = await getNavMenuData();

  const ssWellnessNavChildren: ServicesNavChild[] = [
    { href: "/sulphur-springs/wellness-care-plans", label: nav.nav_wellness_child_plan_label },
    { href: "/sulphur-springs/massage/prices", label: nav.nav_wellness_child_prices_label },
  ];

  return (
    <SiteHeaderClient
      paris={paris}
      sulphur={sulphur}
      giftCardHref={giftCardHref}
      showTopPhoneBar={showTopPhoneBar}
      headerBranding={headerBranding}
      headerColors={headerColors}
      initialBusinessContext={initialBusinessContext}
      servicesNavChildren={parisServices}
      ssServicesNavChildren={ssServices}
      ssWellnessNavChildren={ssWellnessNavChildren}
      staffNavLabel={staffNavLabel}
      chrome={chrome}
    />
  );
}
