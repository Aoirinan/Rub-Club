import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/home-images";
import { telHref } from "@/lib/constants";
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

          <div className="hidden text-right text-xs lg:block">
            <span className="font-bold text-[#173f3b]">Find us on social media</span>
          </div>

          <MobileNav items={NAV_ITEMS} />
        </div>
      </div>

      {/* Blue navigation bar */}
      <DesktopNav items={NAV_ITEMS} />
    </header>
  );
}
