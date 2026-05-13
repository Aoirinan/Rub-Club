import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/home-images";
import { telHref } from "@/lib/constants";
import { MobileNav } from "@/components/MobileNav";
import { DesktopNav, type NavItem } from "@/components/DesktopNav";

const NAV_ITEMS: NavItem[] = [
  { href: "/services/massage", label: "Massage" },
  { href: "/services/chiropractic", label: "Chiropractic" },
  {
    href: "/sulphur-springs",
    label: "Sulphur Springs",
    mega: true,
    children: [
      { href: "/sulphur-springs/staff", label: "Meet the Staff", group: "About" },
      { href: "/sulphur-springs/patient-resources", label: "Patient Resources", group: "About" },
      { href: "/sulphur-springs/q-and-a", label: "Q & A", group: "About" },
      { href: "/sulphur-springs/acupuncture", label: "Acupuncture", group: "Services" },
      { href: "/sulphur-springs/adjustments-and-manipulation", label: "Adjustments", group: "Services" },
      { href: "/sulphur-springs/common-chiropractic-conditions", label: "Common Conditions", group: "Services" },
      { href: "/sulphur-springs/degenerative-disc-disease", label: "Degenerative Disc", group: "Services" },
      { href: "/sulphur-springs/electrical-muscle-stimulation", label: "Electrical Muscle Stim", group: "Services" },
      { href: "/sulphur-springs/ice-pack-cryotherapy", label: "Ice Pack Cryotherapy", group: "Services" },
      { href: "/sulphur-springs/postural-rehabilitation", label: "Postural Rehab", group: "Services" },
      { href: "/sulphur-springs/spinal-decompression", label: "Spinal Decompression", group: "Services" },
      { href: "/sulphur-springs/therapeutic-exercise", label: "Therapeutic Exercise", group: "Services" },
      { href: "/sulphur-springs/therapeutic-ultrasound", label: "Therapeutic Ultrasound", group: "Services" },
      { href: "/sulphur-springs/auto-injury", label: "Auto Injury", group: "Injuries" },
      { href: "/sulphur-springs/personal-injury", label: "Personal Injury", group: "Injuries" },
      { href: "/sulphur-springs/sports-injury", label: "Sports Injury", group: "Injuries" },
    ],
  },
  {
    href: "/locations/paris",
    label: "Locations",
    children: [
      { href: "/locations/paris", label: "Paris, TX" },
      { href: "/locations/sulphur-springs", label: "Sulphur Springs, TX" },
    ],
  },
  {
    href: "/about",
    label: "About",
    children: [
      { href: "/about", label: "About Us" },
      { href: "/sulphur-springs/staff", label: "Sulphur Springs Staff" },
    ],
  },
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

        <DesktopNav items={NAV_ITEMS} />

        <MobileNav items={NAV_ITEMS} />
      </div>
    </header>
  );
}
