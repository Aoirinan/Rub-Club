import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/home-images";
import { telHref } from "@/lib/constants";
import { MobileNav } from "@/components/MobileNav";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/services/massage", label: "Massage" },
  { href: "/services/chiropractic", label: "Chiropractic" },
  { href: "/locations/paris", label: "Locations" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-md">
      <div className="bg-[#0f5f5c] px-4 py-2 text-center text-xs font-bold text-white sm:text-sm">
        <a className="hover:underline" href={telHref("903-785-5551")}>
          Paris 903-785-5551
        </a>
        <span className="mx-3 hidden text-white/60 sm:inline" aria-hidden>
          |
        </span>
        <a className="mt-1 inline-block hover:underline sm:mt-0" href={telHref("903-919-5020")}>
          Sulphur Springs 903-919-5020
        </a>
        <span className="mx-3 hidden text-white/60 md:inline" aria-hidden>
          |
        </span>
        <a
          className="mt-1 block text-[#f2d25d] hover:underline md:mt-0 md:inline"
          href={telHref("903-739-9959")}
        >
          The Rub Club: 903-739-9959
        </a>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex flex-wrap items-center gap-5" aria-label="Home">
          <Image
            src={IMAGES.rubClubLogo}
            alt="The Rub Club"
            width={216}
            height={44}
            className="h-10 w-auto max-w-[210px] object-contain sm:h-12"
            priority
          />
          <span className="hidden text-[#0f5f5c]/30 sm:inline" aria-hidden>
            |
          </span>
          <Image
            src={IMAGES.chiroLogo}
            alt="Chiropractic Associates"
            width={220}
            height={62}
            className="h-11 w-auto max-w-[230px] object-contain sm:h-12"
            priority
          />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden flex-wrap items-center justify-end gap-x-5 gap-y-2 text-xs font-bold uppercase tracking-wide text-[#17433f] md:flex sm:text-sm"
        >
          {NAV_LINKS.map((l) => (
            <Link key={l.href} className="focus-ring hover:text-[#0f817b]" href={l.href}>
              {l.label}
            </Link>
          ))}
          <Link
            className="focus-ring bg-[#f2d25d] px-4 py-2 text-[#17433f] shadow-sm hover:bg-[#e6c13d]"
            href="/book"
          >
            Book
          </Link>
        </nav>

        <MobileNav links={NAV_LINKS} />
      </div>
    </header>
  );
}
