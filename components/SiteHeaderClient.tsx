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
import { CHIRO_TREATMENT_OFFERINGS } from "@/lib/chiro-treatments";
import { parisChiroServiceSlugForName } from "@/lib/paris-chiro-services";
import type { HeaderBrandContent } from "@/lib/brand-logos";
import type { HeaderColorConfig } from "@/lib/header-colors";
import { useSiteBusinessContext } from "@/lib/use-site-business-context";
import type { SiteBusinessContext } from "@/lib/site-business-context";

export function buildDefaultNavItems(
  giftCardHref: string,
  paris: LocationInfo,
  sulphur: LocationInfo,
): NavItem[] {
  return [
    {
      href: "/services/chiropractic",
      label: "Services",
      mega: true,
      children: CHIRO_TREATMENT_OFFERINGS.map((t) => {
        const slug = parisChiroServiceSlugForName(t.name);
        return {
          href: slug ? `/services/chiropractic/${slug}` : "/services/chiropractic",
          label: t.name,
        };
      }),
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
      label: "Staff",
      children: [
        { href: "/locations/paris/staff", label: "Paris" },
        { href: "/sulphur-springs/staff", label: "Sulphur Springs" },
      ],
    },
    {
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
      href: "/contact",
      label: "Locations",
      clinics: [
        {
          name: "Paris",
          addressLines: paris.addressLines,
          phones: [
            { label: "Office", number: paris.phonePrimary },
            ...(paris.phoneSecondary?.trim()
              ? [{ label: "Massage desk", number: paris.phoneSecondary }]
              : []),
          ],
          mapsUrl: paris.mapsUrl,
          contactHref: "/contact",
        },
        {
          name: "Sulphur Springs",
          addressLines: sulphur.addressLines,
          phones: [{ label: "Office", number: sulphur.phonePrimary }],
          mapsUrl: sulphur.mapsUrl,
          contactHref: "/sulphur-springs/contact",
        },
      ],
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
}: {
  paris: LocationInfo;
  sulphur: LocationInfo;
  giftCardHref: string;
  showTopPhoneBar?: boolean;
  headerBranding?: HeaderBrandContent;
  headerColors: HeaderColorConfig;
  initialBusinessContext?: SiteBusinessContext;
}) {
  const businessContext = useSiteBusinessContext(initialBusinessContext);
  const isBusinessScoped =
    businessContext === "paris_chiro" || businessContext === "sulphur_springs";

  // Same nav on every page; only the color theme changes with business context.
  const navItems = buildDefaultNavItems(giftCardHref, paris, sulphur);

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

      {/* Mobile: centered logo row over a full-width MENU bar. */}
      <div className="lg:hidden">
        <SiteHeaderLogoRow>
          <div className="min-w-0 flex-1">
            {isBusinessScoped ? (
              <BusinessLogoHeader
                context={businessContext}
                paris={paris}
                sulphur={sulphur}
                branding={headerBranding}
              />
            ) : (
              <HeaderBrandLogoStrip paris={paris} sulphur={sulphur} branding={headerBranding} />
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
        centerSlot={
          isBusinessScoped ? (
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
          )
        }
      />
    </HeaderThemeProvider>
  );
}
