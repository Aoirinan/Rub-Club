import { buildPageMetadata } from "@/lib/page-metadata";
import Image from "next/image";
import Link from "next/link";
import { BookingCta } from "@/components/BookingCta";
import { telHref, LOCATIONS } from "@/lib/constants";
import { getContentMany } from "@/lib/cms";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { resolveSiteStaffForBrand, splitFeaturedAndGrid } from "@/lib/site-staff";
import { pageKeywords } from "@/lib/seo-keywords";
import { getScopeVisualLayout } from "@/lib/cms-display";
import { getPageBlockOrder } from "@/lib/page-layout-db";
import { ServicePageVisualSection } from "@/components/ServicePageVisualSection";
import { JsonLd } from "@/components/JsonLd";
import { chiropractorJsonLd } from "@/lib/structured-data";
import { SulphurPageBlock } from "./SulphurPageBlocks";

const ss = LOCATIONS.sulphur_springs;

const SS_DOCTOR_FALLBACK = {
  name: "Dr. Conner Collins",
  role: "Chiropractor",
  image: "/images/staff-ss/conner-collins.webp",
  bio: "Dr. Conner Collins is a chiropractor who takes a practical, hands-on approach to patient care.",
};

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Sulphur Springs, TX Chiropractor — Chiropractic Associates",
  brandInTitle: true,
  description:
    "Chiropractic Associates of Sulphur Springs offers chiropractic adjustments, spinal decompression, massage therapy, and rehabilitation at 207 Jefferson St. E. Call 903-919-5020.",
  path: "/sulphur-springs",
  keywords: pageKeywords(["Sulphur Springs chiropractor", "Sulphur Springs massage"]),
  ogDescription:
    "Chiropractic care, spinal decompression, and massage therapy in Sulphur Springs, TX. Call 903-919-5020.",
});

type SSNavLink = { href: string; label: string; items?: undefined };
type SSNavDropdown = {
  label: string;
  items: { href: string; label: string }[];
  href?: undefined;
};
type SSNavEntry = SSNavLink | SSNavDropdown;

const SS_NAV: SSNavEntry[] = [
  { href: "/sulphur-springs", label: "Home" },
  {
    label: "About Us",
    items: [{ href: "/sulphur-springs/staff", label: "Meet The Staff" }],
  },
  {
    label: "Services",
    items: [
      { href: "/sulphur-springs/common-chiropractic-conditions", label: "Common Conditions" },
      { href: "/sulphur-springs/adjustments-and-manipulation", label: "Adjustments" },
      { href: "/sulphur-springs/auto-injury", label: "Auto Injury" },
      { href: "/sulphur-springs/personal-injury", label: "Personal Injury" },
      { href: "/sulphur-springs/sports-injury", label: "Sports Injury" },
    ],
  },
  {
    label: "Patient Resources",
    items: [
      { href: "/sulphur-springs/patient-resources", label: "About Chiropractic" },
      { href: "/sulphur-springs/q-and-a", label: "Q & A" },
      { href: "/patient-forms", label: "Patient forms & intake" },
    ],
  },
  { href: "/book", label: "Appointment Request" },
  { href: "/contact", label: "Contact Us" },
];

export default async function SulphurSpringsPage() {
  const [c, ssOfficeHours, staff, blockOrder, visual] = await Promise.all([
    getContentMany(["ss_hero_heading", "ss_intro_body", "ss_hours"]),
    getSulphurOfficeHours(),
    resolveSiteStaffForBrand("sulphur"),
    getPageBlockOrder("sulphur-springs"),
    getScopeVisualLayout("sulphur-springs"),
  ]);
  const { featured } = splitFeaturedAndGrid(staff);
  const doctor = featured
    ? {
        name: featured.name,
        role: featured.role,
        image: featured.image ?? SS_DOCTOR_FALLBACK.image,
        bio: featured.bio || SS_DOCTOR_FALLBACK.bio,
      }
    : SS_DOCTOR_FALLBACK;
  const blockData = {
    heroHeading: c.ss_hero_heading ?? "",
    introParagraphs: (c.ss_intro_body ?? "").split(/\n\n+/).filter(Boolean),
    ss,
    ssOfficeHours,
    doctor,
  };

  return (
    <div className="bg-[#f4f2ea]">
      <JsonLd data={chiropractorJsonLd(ss)} />
      <nav aria-label="Sulphur Springs navigation" className="relative z-30 bg-[#2980b9] shadow-md">
        <div className="mx-auto flex max-w-6xl flex-wrap">
          {SS_NAV.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/15 sm:text-sm"
              >
                {item.label}
              </Link>
            ) : (
              <details key={item.label} className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-1 whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/15 sm:text-sm [&::-webkit-details-marker]:hidden">
                  {item.label}
                  <svg width="10" height="10" viewBox="0 0 10 10" className="ml-1 transition group-open:rotate-180" aria-hidden>
                    <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="absolute left-0 z-50 min-w-[220px] bg-[#2980b9] shadow-lg">
                  {item.items!.map((sub) => (
                    <Link key={sub.href} href={sub.href} className="block px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1a6da3]">
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </details>
            ),
          )}
        </div>
      </nav>

      <section className="relative min-h-[400px] overflow-hidden bg-[#1a3a4a]">
        <Image
          src="/images/staff-ss/hero-2.webp"
          alt="Chiropractic patient receiving treatment"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c2d3a]/85 via-[#0c2d3a]/50 to-transparent" />
        <div className="relative mx-auto flex min-h-[400px] max-w-6xl flex-col justify-center px-4 py-16 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#5dade2]">Your Spine Health Specialists</p>
          <h1 className="mt-3 max-w-xl text-4xl font-black leading-tight drop-shadow sm:text-5xl">{c.ss_hero_heading}</h1>
          <p className="mt-4 max-w-lg text-lg text-white/90">Your pain-free life, just around the corner.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BookingCta label="Request Appointment" variant="ss" />
            <a
              className="focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[#173f3b]"
              href={telHref(ss.phonePrimary)}
            >
              Call (903) 919-5020
            </a>
          </div>
        </div>
      </section>

      {visual ? (
        <ServicePageVisualSection
          pageId="sulphur-springs"
          visual={visual}
          cms={c as Record<string, string>}
          renderBlock={(id) => <SulphurPageBlock id={id} data={blockData} />}
        />
      ) : (
        <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12">
          {blockOrder.map((id) => (
            <SulphurPageBlock key={id} id={id} data={blockData} />
          ))}
        </div>
      )}
    </div>
  );
}
