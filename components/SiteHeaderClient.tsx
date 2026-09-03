"use client";

import {
  WELLNESS_CARE_PLANS_PATH,
  telHref,
  type LocationInfo,
} from "@/lib/constants";
import type { ReactNode } from "react";
import { HeaderBrandLogoStrip } from "@/components/HeaderBrandLogoStrip";
import { BusinessLogoHeader } from "@/components/BusinessLogoHeader";
import { BusinessSubNav } from "@/components/BusinessSubNav";
import { HeaderThemeProvider, useHeaderCompact } from "@/components/HeaderThemeProvider";
import {
  DEFAULT_NAV_CHROME,
  NavChromeProvider,
  type NavChrome,
} from "@/components/NavChromeContext";
import { SiteHeaderLogoRow } from "@/components/SiteHeaderLogoRow";
import { MobileNav } from "@/components/MobileNav";
import type { NavItem } from "@/components/DesktopNav";
import {
  buildParisChiroNavChildren,
} from "@/lib/paris-chiro-services";
import type { HeaderBrandContent } from "@/lib/brand-logos";
import type { HeaderColorConfig } from "@/lib/header-colors";
import { NAV_TEXT_DEFAULTS, type NavText } from "@/lib/nav-cms";
import { useSiteBusinessContext } from "@/lib/use-site-business-context";
import type { SiteBusinessContext } from "@/lib/site-business-context";

export type ServicesNavChild = { href: string; label: string; group?: string };

export function buildDefaultNavItems(
  giftCardHref: string,
  paris: LocationInfo,
  sulphur: LocationInfo,
  servicesNavChildren?: ServicesNavChild[],
  ssServicesNavChildren?: ServicesNavChild[],
  businessContext: SiteBusinessContext = "default",
  ssWellnessNavChildren?: ServicesNavChild[],
  staffNavLabel = "About Us",
  nav: NavText = NAV_TEXT_DEFAULTS,
): NavItem[] {
  // On the Sulphur Springs section, the Services / Wellness Plan dropdowns stay
  // on SS pages instead of jumping to the Paris equivalents.
  const onSulphur = businessContext === "sulphur_springs";
  return [
    {
      key: "home",
      href: onSulphur ? "/sulphur-springs" : "/",
      label: nav.nav_home_label,
    },
    onSulphur && ssServicesNavChildren?.length
      ? {
          key: "services",
          href: "/sulphur-springs",
          label: nav.nav_services_label,
          mega: true,
          children: ssServicesNavChildren,
        }
      : {
          key: "services",
          href: "/services/chiropractic",
          label: nav.nav_services_label,
          mega: true,
          // Grouped legacy Services mega-menu when provided; static fallback.
          children: servicesNavChildren ?? buildParisChiroNavChildren(),
        },
    {
      key: "chiropractic",
      href: "/services/chiropractic",
      label: nav.nav_chiropractic_label,
      children: [
        { href: "/services/chiropractic", label: nav.nav_child_paris_label },
        { href: "/sulphur-springs", label: nav.nav_child_sulphur_label },
      ],
    },
    {
      key: "massage",
      href: "/services/massage",
      label: nav.nav_massage_label,
      children: [
        { href: "/services/massage", label: nav.nav_child_paris_label },
        { href: "/sulphur-springs/massage", label: nav.nav_child_sulphur_label },
      ],
    },
    {
      key: "about",
      href: "/locations/paris/staff",
      label: staffNavLabel,
      children: [
        { href: "/locations/paris/staff", label: nav.nav_child_paris_label },
        { href: "/sulphur-springs/staff", label: nav.nav_child_sulphur_label },
      ],
    },
    onSulphur && ssWellnessNavChildren?.length
      ? {
          key: "wellness",
          href: "/sulphur-springs/wellness-care-plans",
          label: nav.nav_wellness_label,
          children: ssWellnessNavChildren,
        }
      : {
          key: "wellness",
          href: WELLNESS_CARE_PLANS_PATH,
          label: nav.nav_wellness_label,
          children: [
            { href: WELLNESS_CARE_PLANS_PATH, label: nav.nav_wellness_child_plan_label },
            { href: "/services/massage/prices", label: nav.nav_wellness_child_prices_label },
          ],
        },
    {
      key: "giftcards",
      href: giftCardHref,
      label: nav.nav_giftcards_label,
      external: true,
      giftCard: true,
    },
    { key: "patient-forms", href: "/patient-forms", label: nav.nav_patient_forms_label },
    {
      key: "contact",
      href: onSulphur ? "/sulphur-springs/contact" : "/contact",
      label: nav.nav_contact_label,
      clinics: (() => {
        const parisClinic = {
          name: nav.nav_contact_paris_name,
          addressLines: paris.addressLines,
          phones: [
            { label: nav.nav_contact_office_label, number: paris.phonePrimary },
            ...(paris.phoneSecondary?.trim()
              ? [{ label: nav.nav_contact_massage_desk_label, number: paris.phoneSecondary }]
              : []),
          ],
          fax: paris.fax,
          mapsUrl: paris.mapsUrl,
          contactHref: "/contact",
        };
        const ssClinic = {
          name: nav.nav_contact_sulphur_name,
          addressLines: sulphur.addressLines,
          phones: [{ label: nav.nav_contact_office_label, number: sulphur.phonePrimary }],
          fax: sulphur.fax,
          mapsUrl: sulphur.mapsUrl,
          contactHref: "/sulphur-springs/contact",
        };
        return onSulphur ? [ssClinic, parisClinic] : [parisClinic, ssClinic];
      })(),
    },
  ];
}

/**
 * Tier-1 wrapper: smoothly collapses to zero height once the visitor scrolls
 * (backpro-style shrink header). Uses the grid-rows trick so height animates
 * without hardcoded max-height values. Must render inside HeaderThemeProvider.
 */
function HeaderTier1Collapse({ children }: { children: ReactNode }) {
  const compact = useHeaderCompact();
  return (
    <div
      aria-hidden={compact || undefined}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
        compact ? "[grid-template-rows:0fr] opacity-0" : "[grid-template-rows:1fr] opacity-100"
      }`}
    >
      <div className={`min-h-0 overflow-hidden ${compact ? "invisible" : ""}`}>{children}</div>
    </div>
  );
}

export function SiteHeaderClient({
  paris,
  sulphur,
  giftCardHref,
  showTopPhoneBar = true,
  headerBranding,
  headerColors,
  initialBusinessContext = "default",
  servicesNavChildren,
  ssServicesNavChildren,
  ssWellnessNavChildren,
  staffNavLabel = "About Us",
  chrome = DEFAULT_NAV_CHROME,
}: {
  paris: LocationInfo;
  sulphur: LocationInfo;
  giftCardHref: string;
  showTopPhoneBar?: boolean;
  headerBranding?: HeaderBrandContent;
  headerColors: HeaderColorConfig;
  initialBusinessContext?: SiteBusinessContext;
  servicesNavChildren?: ServicesNavChild[];
  ssServicesNavChildren?: ServicesNavChild[];
  ssWellnessNavChildren?: ServicesNavChild[];
  staffNavLabel?: string;
  /** Editable header labels (server-resolved); defaults keep today's text. */
  chrome?: NavChrome;
}) {
  const businessContext = useSiteBusinessContext(initialBusinessContext);
  const isBusinessScoped =
    businessContext === "paris_chiro" || businessContext === "sulphur_springs";
  const nav = chrome.nav;

  // Same nav on every page except Services, which stays within the current
  // section of the site (Paris vs. Sulphur Springs); colors follow context too.
  const navItems = buildDefaultNavItems(
    giftCardHref,
    paris,
    sulphur,
    servicesNavChildren,
    ssServicesNavChildren,
    businessContext,
    ssWellnessNavChildren,
    staffNavLabel,
    nav,
  );

  const rub = paris.phoneSecondary?.trim();

  return (
    <NavChromeProvider value={chrome}>
    <HeaderThemeProvider colors={headerColors} initialBusinessContext={initialBusinessContext}>
      {showTopPhoneBar ? (
        <HeaderTier1Collapse>
          <div className="bg-[var(--header-phone-bar-bg)] px-4 py-1.5 text-center text-xs font-bold text-white sm:text-sm">
            {businessContext === "paris_chiro" ? (
              <a className="hover:underline" href={telHref(paris.phonePrimary)}>
                {nav.nav_phone_bar_paris_chiro_prefix} {paris.phonePrimary}
              </a>
            ) : businessContext === "sulphur_springs" ? (
              <a className="hover:underline" href={telHref(sulphur.phonePrimary)}>
                {nav.nav_phone_bar_sulphur_prefix} {sulphur.phonePrimary}
              </a>
            ) : (
              <>
                <a className="hover:underline" href={telHref(paris.phonePrimary)}>
                  {nav.nav_phone_bar_paris_prefix} {paris.phonePrimary}
                </a>
                <span className="mx-3 hidden text-white/40 sm:inline" aria-hidden>
                  |
                </span>
                <a
                  className="mt-1 inline-block hover:underline sm:mt-0"
                  href={telHref(sulphur.phonePrimary)}
                >
                  {nav.nav_phone_bar_sulphur_prefix} {sulphur.phonePrimary}
                </a>
                {rub ? (
                  <>
                    <span className="mx-3 hidden text-white/40 md:inline" aria-hidden>
                      |
                    </span>
                    <a
                      className="mt-1 block text-[#f19f1f] hover:underline md:mt-0 md:inline"
                      href={telHref(rub)}
                    >
                      {nav.nav_phone_bar_rub_prefix} {rub}
                    </a>
                  </>
                ) : null}
              </>
            )}
          </div>
        </HeaderTier1Collapse>
      ) : null}

      {/* Mobile: big centered logo over a full-width MENU bar (no redundant
          phone/label — contact lives in the sticky bottom Call/Book bar). */}
      <div className="lg:hidden">
        <SiteHeaderLogoRow>
          <div className="min-w-0 flex-1">
            {isBusinessScoped ? (
              <BusinessLogoHeader
                context={businessContext}
                paris={paris}
                sulphur={sulphur}
                branding={headerBranding}
                showContact={false}
              />
            ) : (
              <HeaderBrandLogoStrip
                paris={paris}
                sulphur={sulphur}
                branding={headerBranding}
                showContact={false}
              />
            )}
          </div>
        </SiteHeaderLogoRow>
      </div>

      <MobileNav
        items={navItems}
        giftCardHref={giftCardHref}
        paris={paris}
        sulphur={sulphur}
        businessContext={businessContext}
      />

      {/* Desktop: Backpro-style single bar — nav links split around the centered logo. */}
      <BusinessSubNav
        items={navItems}
        showBookCta
        businessContext={businessContext}
        centerSlot={
          isBusinessScoped ? (
            <BusinessLogoHeader
              context={businessContext}
              paris={paris}
              sulphur={sulphur}
              branding={headerBranding}
              showContact={false}
              large
            />
          ) : (
            <HeaderBrandLogoStrip
              paris={paris}
              sulphur={sulphur}
              branding={headerBranding}
              showContact={false}
              large
            />
          )
        }
      />
    </HeaderThemeProvider>
    </NavChromeProvider>
  );
}
