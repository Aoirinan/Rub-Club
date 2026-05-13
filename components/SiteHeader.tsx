import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/home-images";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/15 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex flex-wrap items-center gap-4">
          <Image
            src={IMAGES.rubClubLogo}
            alt="The Rub Club"
            width={216}
            height={44}
            className="h-9 w-auto max-w-[200px] object-contain sm:h-10"
            priority
          />
          <span className="hidden text-emerald-900/30 sm:inline" aria-hidden>
            |
          </span>
          <Image
            src={IMAGES.chiroLogo}
            alt="Chiropractic Associates"
            width={220}
            height={62}
            className="h-10 w-auto max-w-[220px] object-contain sm:h-11"
            priority
          />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-semibold text-emerald-950">
          <Link className="hover:text-teal-700" href="/#the-rub-club">
            Massage
          </Link>
          <Link className="hover:text-teal-700" href="/#chiropractic-associates">
            Chiropractic
          </Link>
          <Link className="hover:text-teal-700" href="/#locations">
            Locations
          </Link>
          <Link
            className="rounded-full bg-teal-700 px-4 py-2 text-white shadow-sm hover:bg-teal-800"
            href="/book"
          >
            Book
          </Link>
          <Link className="text-stone-600 hover:text-stone-900" href="/admin/login">
            Staff
          </Link>
        </nav>
      </div>
    </header>
  );
}
