import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/home-images";
import { FACEBOOK_URL, telHref } from "@/lib/constants";
import { MobileNav } from "@/components/MobileNav";
import { DesktopNav, type NavItem } from "@/components/DesktopNav";

const NAV_ITEMS: NavItem[] = [
  { href: "/services/massage", label: "Massage" },
  { href: "/services/chiropractic", label: "Chiropractic" },
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
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      {/* Top bar — phone numbers */}
      <div className="bg-[#0c2d3a] px-4 py-2 text-center text-xs font-bold text-white sm:text-sm">
        <a className="hover:underline" href={telHref("903-785-5551")}>
          Paris 903-785-5551
        </a>
        <span className="mx-3 hidden text-white/40 sm:inline" aria-hidden>
          |
        </span>
        <a
          className="mt-1 inline-block hover:underline sm:mt-0"
          href={telHref("903-919-5020")}
        >
          Sulphur Springs 903-919-5020
        </a>
        <span className="mx-3 hidden text-white/40 md:inline" aria-hidden>
          |
        </span>
        <a
          className="mt-1 block text-[#f2d25d] hover:underline md:mt-0 md:inline"
          href={telHref("903-739-9959")}
        >
          The Rub Club: 903-739-9959
        </a>
      </div>

      {/* Logo row */}
      <div className="bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/"
            className="flex flex-wrap items-center gap-3 lg:gap-4"
            aria-label="Home"
          >
            <Image
              src={IMAGES.rubClubLogo}
              alt="The Rub Club"
              width={216}
              height={44}
              className="h-9 w-auto max-w-[180px] object-contain sm:h-10 lg:h-11"
              priority
            />
            <span
              className="hidden text-[#0f5f5c]/30 sm:inline"
              aria-hidden
            >
              |
            </span>
            <Image
              src={IMAGES.chiroLogo}
              alt="Chiropractic Associates"
              width={220}
              height={62}
              className="h-9 w-auto max-w-[190px] object-contain sm:h-10 lg:h-11"
              priority
            />
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

          <MobileNav items={NAV_ITEMS} />
        </div>
      </div>

      {/* Blue navigation bar */}
      <DesktopNav items={NAV_ITEMS} />
    </header>
  );
}
