import { FACEBOOK_URL, WELLNESS_CARE_PLANS_PATH, telHref, type LocationInfo } from "@/lib/constants";
import type { HeaderBrandingHeights } from "@/lib/header-branding-cms";
import { HeaderBrandLogoStrip } from "@/components/HeaderBrandLogoStrip";
import { MobileNav } from "@/components/MobileNav";
import { DesktopNav, type NavItem } from "@/components/DesktopNav";

function buildNavItems(giftCardHref: string): NavItem[] {
  return [
    { href: "/services/massage", label: "Massage" },
    {
      href: "/services/chiropractic",
      label: "Chiropractic",
      children: [
        { href: "/services/chiropractic", label: "Chiropractic care" },
        { href: WELLNESS_CARE_PLANS_PATH, label: "Wellness care plans" },
      ],
    },
    { href: "/", label: "Paris Texas" },
    { href: "/sulphur-springs", label: "Sulphur Springs" },
    {
      href: "/locations/paris",
      label: "Locations",
      children: [
        { href: "/locations/paris", label: "Paris, TX" },
        { href: "/locations/sulphur-springs", label: "Sulphur Springs, TX" },
      ],
    },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    {
      href: giftCardHref,
      label: "Gift cards",
      external: true,
    },
    { href: "/patient-forms", label: "Patient forms" },
    { href: "/contact", label: "Contact" },
  ];
}

export function SiteHeader({
  paris,
  sulphur,
  giftCardHref,
  headerHeights,
}: {
  paris: LocationInfo;
  sulphur: LocationInfo;
  giftCardHref: string;
  headerHeights?: HeaderBrandingHeights;
}) {
  const navItems = buildNavItems(giftCardHref);
  const rub = paris.phoneSecondary?.trim();

  return (
    <header className="sticky top-0 z-40">
      {/* Top bar — phone numbers */}
      <div className="bg-[#0c2d3a] px-4 py-1.5 text-center text-xs font-bold text-white sm:text-sm">
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
              className="mt-1 block text-[#f2d25d] hover:underline md:mt-0 md:inline"
              href={telHref(rub)}
            >
              The Rub Club: {rub}
            </a>
          </>
        ) : null}
      </div>

      {/* Logo row — wide lockups with tap-to-call under each brand */}
      <div className="bg-white px-4 py-3 sm:py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <HeaderBrandLogoStrip
              paris={paris}
              sulphur={sulphur}
              headerHeights={headerHeights}
            />
          </div>

          <div className="hidden items-center justify-end gap-2 text-xs lg:flex">
            <span className="font-bold text-[#173f3b]">
              Find us on social media
            </span>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 text-[#173f3b] transition-colors hover:text-[#0f5f5c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f5c]"
              aria-label="Chiropractic Associates on Facebook (opens in a new tab)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>

          <MobileNav items={navItems} giftCardHref={giftCardHref} paris={paris} sulphur={sulphur} />
        </div>
      </div>

      {/* Blue navigation bar */}
      <DesktopNav items={navItems} />
    </header>
  );
}
