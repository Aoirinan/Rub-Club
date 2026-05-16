import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaCard } from "@/components/PageChrome";
import { BookingCta } from "@/components/BookingCta";
import { telHref, LOCATIONS } from "@/lib/constants";
import { publicBookingHref } from "@/lib/public-booking";
import { getContentMany, renderRichText } from "@/lib/cms";
import {
  SS_STAFF,
  SS_SERVICE_NAV,
  SS_INJURY_NAV,
} from "@/lib/sulphur-springs-content";

const ss = LOCATIONS.sulphur_springs;
const doctor = SS_STAFF[0];

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sulphur Springs, TX Chiropractor — Chiropractic Associates",
  description:
    "Chiropractic Associates of Sulphur Springs offers chiropractic adjustments, spinal decompression, massage therapy, and rehabilitation at 207 Jefferson St. E. Call 903-919-5020.",
  alternates: { canonical: "/sulphur-springs" },
  openGraph: {
    title: "Sulphur Springs, TX Chiropractor — Chiropractic Associates",
    description:
      "Chiropractic care, spinal decompression, and massage therapy in Sulphur Springs, TX. Call 903-919-5020.",
    url: "/sulphur-springs",
  },
};

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
    items: [
      { href: "/sulphur-springs/staff", label: "Meet The Staff" },
    ],
  },
  {
    label: "Services",
    items: [
      ...SS_SERVICE_NAV,
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
  const c = await getContentMany(["ss_hero_heading", "ss_intro_body", "ss_hours"]);
  const introParagraphs = (c.ss_intro_body ?? "").split(/\n\n+/).filter(Boolean);
  const hoursLines = (c.ss_hours ?? "").split(/\n/).filter(Boolean);

  return (
    <div className="bg-[#f4f2ea]">
      {/* SS Header with logo and phone */}
      <div className="bg-white border-b border-stone-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <Link href="/sulphur-springs" className="flex items-center gap-4">
            <Image
              src="/images/staff-ss/ss-logo.webp"
              alt="Chiropractic Associates of Sulphur Springs"
              width={280}
              height={36}
              className="h-9 w-auto object-contain sm:h-11"
            />
          </Link>
          <div className="text-right text-sm">
            <p className="font-bold text-[#173f3b]">Chiropractic Associates</p>
            <a
              href={telHref(ss.phonePrimary)}
              className="text-lg font-black text-[#0f5f5c] hover:underline"
            >
              (903) 919-5020
            </a>
          </div>
        </div>
      </div>

      {/* SS Navigation bar */}
      <nav
        aria-label="Sulphur Springs navigation"
        className="relative z-30 bg-[#2980b9] shadow-md"
      >
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
                <summary className="flex cursor-pointer items-center gap-1 whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/15 sm:text-sm [&::-webkit-details-marker]:hidden list-none">
                  {item.label}
                  <svg width="10" height="10" viewBox="0 0 10 10" className="ml-1 transition group-open:rotate-180" aria-hidden>
                    <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="absolute left-0 z-50 min-w-[220px] bg-[#2980b9] shadow-lg">
                  {item.items!.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className="block px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1a6da3]"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </details>
            ),
          )}
        </div>
      </nav>

      {/* Hero banner */}
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
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#5dade2]">
            Your Spine Health Specialists
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-black leading-tight drop-shadow sm:text-5xl">
            {c.ss_hero_heading}
          </h1>
          <p className="mt-4 max-w-lg text-lg text-white/90">
            Your pain-free life, just around the corner.
          </p>
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

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12">
        {/* Featured Services */}
        <section aria-label="Featured services" className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Pain Relief", href: "/sulphur-springs/common-chiropractic-conditions", desc: "Chiropractic care can help you manage your pain." },
            { label: "Adjustments", href: "/sulphur-springs/adjustments-and-manipulation", desc: "Keep the body functioning at its highest level." },
            { label: "Sports Injury", href: "/sulphur-springs/sports-injury", desc: "Reach an optimum level of achievement." },
            { label: "Auto Injury", href: "/sulphur-springs/auto-injury", desc: "No underlying injuries after a car accident." },
          ].map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="group border-t-4 border-[#2980b9] bg-white p-5 shadow-md transition hover:shadow-lg"
            >
              <h2 className="text-base font-black text-[#173f3b] group-hover:text-[#2980b9]">
                {tile.label}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">{tile.desc}</p>
              <span className="mt-3 inline-block text-xs font-black uppercase tracking-wide text-[#2980b9]">
                Click Here
              </span>
            </Link>
          ))}
        </section>

        {/* Intro content */}
        <section className="grid gap-10 border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#173f3b]">{c.ss_hero_heading}</h2>
            {introParagraphs.map((p) => (
              <p
                key={p.slice(0, 40)}
                className="leading-relaxed text-stone-700"
                dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
              />
            ))}
            <p className="leading-relaxed text-stone-700">
              Upon your initial examination, we will discuss with you our findings and what they mean. We will create a custom treatment plan to get you to where you want to be, whether that means less pain, better performance, or just better overall health.
            </p>
            <p className="leading-relaxed text-stone-700">
              Through our expert care, our advanced office, and our caring staff, we will help you not only get back on your feet, but understand how spine health affects your overall quality of life.
            </p>
          </div>
          {/* Sidebar: Location & Hours */}
          <aside className="space-y-6 border-t border-stone-200 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-[#2980b9]">Our Location</h3>
              <p className="mt-2 font-bold text-[#173f3b]">
                {ss.addressLines.join(", ")}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-[#2980b9]">Office Hours</h3>
              <dl className="mt-2 space-y-1 text-sm text-stone-700">
                {hoursLines.map((line) => {
                  const sep = line.includes(":") ? ":" : "–";
                  const parts = line.split(sep);
                  const day = parts[0]?.trim() ?? line;
                  const hours = parts.slice(1).join(sep).trim() || line;
                  return (
                    <div key={line} className="flex justify-between gap-3 border-b border-stone-100 py-1">
                      <dt className="font-medium">{day}</dt>
                      <dd className={/closed/i.test(hours) ? "text-stone-400" : ""}>{hours}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
            <a
              href={telHref(ss.phonePrimary)}
              className="inline-block text-lg font-black text-[#2980b9] hover:underline"
            >
              (903) 919-5020
            </a>
          </aside>
        </section>

        {/* Doctor spotlight */}
        <section className="grid gap-8 border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[minmax(0,1fr)_2fr]">
          {doctor.image ? (
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-200">
              <Image
                src={doctor.image}
                alt={`Portrait of ${doctor.name}, ${doctor.role}`}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </div>
          ) : null}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-[#173f3b]">{doctor.name}</h2>
              <p className="text-sm font-bold text-stone-600">{doctor.role}</p>
            </div>
            <p className="leading-relaxed text-stone-700">
              {doctor.bio.split("\n\n")[0]}
            </p>
            <Link
              href="/sulphur-springs/staff"
              className="focus-ring inline-flex bg-[#2980b9] px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#1a6da3]"
            >
              Meet the full team
            </Link>
          </div>
        </section>

        {/* All Services */}
        <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Our Services</h2>
          <p className="mt-2 text-stone-600">
            We offer a variety of services to treat common conditions and injuries. Call (903) 919-5020 for more information.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SS_SERVICE_NAV.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex items-center gap-3 rounded border border-stone-200 bg-stone-50 px-4 py-3 transition hover:border-[#2980b9]/30 hover:bg-[#2980b9]/5"
              >
                <span className="text-sm font-bold text-[#173f3b] group-hover:text-[#2980b9]">{s.label}</span>
                <span className="ml-auto text-stone-400 group-hover:text-[#2980b9]" aria-hidden>&rarr;</span>
              </Link>
            ))}
          </div>

          <h3 className="mt-10 text-lg font-black text-[#173f3b]">Injuries</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SS_INJURY_NAV.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className="group flex items-center gap-3 rounded border border-stone-200 bg-stone-50 px-4 py-3 transition hover:border-[#2980b9]/30 hover:bg-[#2980b9]/5"
              >
                <span className="text-sm font-bold text-[#173f3b] group-hover:text-[#2980b9]">{i.label}</span>
                <span className="ml-auto text-stone-400 group-hover:text-[#2980b9]" aria-hidden>&rarr;</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick links */}
        <section className="grid gap-6 sm:grid-cols-2">
          <Link
            href="/sulphur-springs/patient-resources"
            className="group border-t-4 border-[#2980b9] bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
          >
            <h2 className="text-xl font-black text-[#173f3b] group-hover:underline">Patient Resources</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Helpful links and information about chiropractic care.
            </p>
          </Link>
          <Link
            href="/sulphur-springs/q-and-a"
            className="group border-t-4 border-[#2980b9] bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
          >
            <h2 className="text-xl font-black text-[#173f3b] group-hover:underline">Questions &amp; Answers</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Common questions about chiropractic treatment answered.
            </p>
          </Link>
        </section>

        <CtaCard
          title="Ready for relief?"
          body="Book an appointment online or give us a call — we're here to help you feel better and move better."
          primary={{ label: "Request appointment", href: publicBookingHref() }}
          secondary={{ label: "Call (903) 919-5020", href: telHref(ss.phonePrimary) }}
        />
      </div>
    </div>
  );
}
