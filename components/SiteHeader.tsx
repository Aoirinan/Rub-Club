import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/home-images";
import { FACEBOOK_URL, WELLNESS_CARE_PLANS_PATH, telHref, type LocationInfo } from "@/lib/constants";
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
}: {
  paris: LocationInfo;
  sulphur: LocationInfo;
  giftCardHref: string;
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

      {/* Logo row */}
      <div className="bg-white px-4 py-2.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/"
            className="flex flex-wrap items-center gap-3 lg:gap-4"
            aria-label="The Rub Club and Chiropractic Associates home"
          >
            <Image
              src={IMAGES.rubClubLogo}
              alt="The Rub Club"
              width={216}
              height={44}
              className="h-8 w-auto max-w-[180px] object-contain sm:h-9 lg:h-10"
              priority
            />
            {/* CDN chiro lockup is too low-contrast on white; vector + type reads clearly. */}
            <div className="ml-0.5 flex min-w-0 items-center gap-2 border-l-2 border-[#e6c13d] pl-2.5 sm:ml-0 sm:gap-2.5 sm:pl-3 lg:pl-4">
              <svg
                className="h-7 w-[14px] shrink-0 text-[#d4a82a] sm:h-8 sm:w-4 lg:h-9 lg:w-[18px]"
                viewBox="0 0 24 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M20 6C8 20 8 44 20 58"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
              <div className="min-w-0 flex flex-col leading-none">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#9a7a12] sm:text-[9px] lg:text-[10px]">
                  Chiropractic
                </span>
                <span className="mt-1 text-[10px] font-black uppercase tracking-[0.06em] text-[#0c2d3a] sm:text-[11px] lg:text-xs">
                  Associates
                </span>
              </div>
            </div>
          </Link>

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
