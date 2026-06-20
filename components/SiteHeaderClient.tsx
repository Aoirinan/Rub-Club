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
import { SiteHeaderLogoRow } from "@/components/SiteHeaderLogoRow";
import { MobileNav } from "@/components/MobileNav";
import type { NavItem } from "@/components/DesktopNav";
import {
  buildParisChiroNavChildren,
} from "@/lib/paris-chiro-services";
import type { HeaderBrandContent } from "@/lib/brand-logos";
import type { HeaderColorConfig } from "@/lib/header-colors";
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
): NavItem[] {
  // On the Sulphur Springs section, the Services / Wellness Plan dropdowns stay
  // on SS pages instead of jumping to the Paris equivalents.
  const onSulphur = businessContext === "sulphur_springs";
  return [
    {
      href: onSulphur ? "/sulphur-springs" : "/",
      label: "Home",
    },
    onSulphur && ssServicesNavChildren?.length
      ? {
          href: "/sulphur-springs",
          label: "Services",
          mega: true,
          children: ssServicesNavChildren,
        }
      : {
          href: "/services/chiropractic",
          label: "Services",
          mega: true,
          // Grouped legacy Services mega-menu when provided; static fallback.
          children: servicesNavChildren ?? buildParisChiroNavChildren(),
        },
    {
      href: "/services/chiropractic",
      label: "Chiropractic",
      children: [
        { href: "/services/chiropractic", label: "Paris" },
        { href: "/sulphur-springs", label: "Sulphur Springs" },
      ],
    },
    {
      href: "/services/massage",
      label: "Massage",
      children: [
        { href: "/services/massage", label: "Paris" },
        { href: "/sulphur-springs/massage", label: "Sulphur Springs" },
      ],
    },
    {
      href: "/locations/paris/staff",
      label: staffNavLabel,
      children: [
        { href: "/locations/paris/staff", label: "Paris" },
        { href: "/sulphur-springs/staff", label: "Sulphur Springs" },
      ],
    },
    onSulphur && ssWellnessNavChildren?.length
      ? {
          href: "/sulphur-springs/wellness-care-plans",
          label: "Wellness Plan",
          children: ssWellnessNavChildren,
        }
      : {
          href: WELLNESS_CARE_PLANS_PATH,
          label: "Wellness Plan",
          children: [
            { href: WELLNESS_CARE_PLANS_PATH, label: "Wellness Plan" },
            { href: "/services/massage/prices", label: "Massage Prices" },
          ],
        },
    {
      href: giftCardHref,
      label: "Gift cards",
      external: true,
    },
    { href: "/patient-forms", label: "Patient Forms" },
    {
      href: onSulphur ? "/sulphur-springs/contact" : "/contact",
      label: "Contact Us",
      clinics: (() => {
        const parisClinic = {
          name: "Paris (main office)",
          addressLines: paris.addressLines,
          phones: [
            { label: "Office", number: paris.phonePrimary },
            ...(paris.phoneSecondary?.trim()
              ? [{ label: "Massage desk", number: paris.phoneSecondary }]
              : []),
          ],
          fax: paris.fax,
          mapsUrl: paris.mapsUrl,
        };
        const ssClinic = {
          name: "Sulphur Springs (second location)",
          addressLines: sulphur.addressLines,
          phones: [{ label: "Office", number: sulphur.phonePrimary }],
          fax: sulphur.fax,
          mapsUrl: sulphur.mapsUrl,
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
}) {
  const businessContext = useSiteBusinessContext(initialBusinessContext);
  const isBusinessScoped =
    businessContext === "paris_chiro" || businessContext === "sulphur_springs";

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
  );

  const rub = paris.phoneSecondary?.trim();

  return (
    <HeaderThemeProvider colors={headerColors} initialBusinessContext={initialBusinessContext}>
      {showTopPhoneBar ? (
        <HeaderTier1Collapse>
          <div className="bg-[var(--header-phone-bar-bg)] px-4 py-1.5 text-center text-xs font-bold text-white sm:text-sm">
            {businessContext === "paris_chiro" ? (
              <a className="hover:underline" href={telHref(paris.phonePrimary)}>
                Paris Chiropractic {paris.phonePrimary}
              </a>
            ) : businessContext === "sulphur_springs" ? (
              <a className="hover:underline" href={telHref(sulphur.phonePrimary)}>
                Sulphur Springs {sulphur.phonePrimary}
              </a>
            ) : (
              <>
                <a className="hover:underline" href={telHref(paris.phonePrimary)}>
                  Paris {paris.phonePrimary}
                </a>
                <span className="mx-3 hidden text-white/40 sm:inline" aria-hidden>
                  |
                </span>
                <a
                  className="mt-1 inline-block hover:underline sm:mt-0"
                  href={telHref(sulphur.phonePrimary)}
                >
                  Sulphur Springs {sulphur.phonePrimary}
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
                      The Rub Club: {rub}
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
  );
}
