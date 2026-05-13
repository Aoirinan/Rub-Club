import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/home-images";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-md">
      <div className="bg-[#0f5f5c] px-4 py-2 text-center text-xs font-bold text-white sm:text-sm">
        <span className="inline-block">( Main Office ) Paris, TX 903-785-5551</span>
        <span className="mx-3 hidden text-white/60 sm:inline" aria-hidden>
          |
        </span>
        <span className="mt-1 inline-block sm:mt-0">Sulphur Springs, TX 903-919-5020</span>
        <span className="mx-3 hidden text-white/60 md:inline" aria-hidden>
          |
        </span>
        <a className="mt-1 block text-[#f2d25d] hover:underline md:mt-0 md:inline" href="tel:9037399959">
          The Rub Club: 903-739-9959
        </a>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex flex-wrap items-center gap-5">
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
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-xs font-bold uppercase tracking-wide text-[#17433f] sm:text-sm">
          <Link className="hover:text-[#0f817b]" href="/#the-rub-club">
            Massage
          </Link>
          <Link className="hover:text-[#0f817b]" href="/#chiropractic-associates">
            Chiropractic
          </Link>
          <Link className="hover:text-[#0f817b]" href="/#locations">
            Locations
          </Link>
          <Link className="hover:text-[#0f817b]" href="/patient-forms">
            Patient forms
          </Link>
          <Link
            className="bg-[#f2d25d] px-4 py-2 text-[#17433f] shadow-sm hover:bg-[#e6c13d]"
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
