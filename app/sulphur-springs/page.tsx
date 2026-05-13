import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { telHref, LOCATIONS } from "@/lib/constants";
import {
  SS_STAFF,
  SS_SERVICE_NAV,
  SS_INJURY_NAV,
} from "@/lib/sulphur-springs-content";

const ss = LOCATIONS.sulphur_springs;
const doctor = SS_STAFF[0];

export const metadata: Metadata = {
  title: "Sulphur Springs, TX Chiropractic — Chiropractic Associates",
  description:
    "Chiropractic Associates of Sulphur Springs offers chiropractic adjustments, spinal decompression, massage therapy, and rehabilitation at 207 Jefferson St. E. Call 903-919-5020.",
  alternates: { canonical: "/sulphur-springs" },
  openGraph: {
    title: "Sulphur Springs, TX Chiropractic — Chiropractic Associates",
    description:
      "Chiropractic care, spinal decompression, and massage therapy in Sulphur Springs, TX. Walk-ins welcome — call 903-919-5020.",
    url: "/sulphur-springs",
  },
};

const SUB_NAV = [
  { href: "/sulphur-springs/staff", label: "Meet the Staff" },
  { href: "#services", label: "Services" },
  { href: "/sulphur-springs/patient-resources", label: "Patient Resources" },
  { href: "/sulphur-springs/q-and-a", label: "Q & A" },
  { href: "#location", label: "Location & Hours" },
];

export default function SulphurSpringsPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
        ]}
      />
      <PageHero
        eyebrow="Chiropractic Associates · Sulphur Springs, TX"
        title="Chiropractic Care in Sulphur Springs"
        lede="Our Sulphur Springs office at 207 Jefferson St. E provides hands-on chiropractic care, spinal decompression, massage therapy, and rehabilitation for Hopkins County and the surrounding communities."
      />

      {/* Sub-navigation */}
      <nav
        aria-label="Sulphur Springs pages"
        className="mx-auto max-w-6xl overflow-x-auto px-4"
      >
        <div className="flex gap-1 border-b-2 border-[#0f5f5c]">
          {SUB_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#173f3b] hover:bg-[#0f5f5c]/5 hover:text-[#0f5f5c] sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-10">
        {/* Doctor spotlight */}
        <section className="grid gap-8 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[minmax(0,1fr)_2fr]">
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
              <h2 className="text-2xl font-black text-[#173f3b]">
                {doctor.name}
              </h2>
              <p className="text-sm font-bold text-stone-600">{doctor.role}</p>
            </div>
            <p className="leading-relaxed text-stone-700">
              {doctor.bio.split("\n\n")[0]}
            </p>
            <Link
              href="/sulphur-springs/staff"
              className="focus-ring inline-flex bg-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
            >
              Meet the full team
            </Link>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-32 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Our Services</h2>
          <p className="mt-2 text-stone-600">
            We offer a variety of services to treat common conditions and injuries. Click any service to learn more.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SS_SERVICE_NAV.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex items-center gap-3 rounded border border-stone-200 bg-stone-50 px-4 py-3 transition hover:border-[#0f5f5c]/30 hover:bg-[#0f5f5c]/5"
              >
                <span className="text-sm font-bold text-[#173f3b] group-hover:text-[#0f5f5c]">
                  {s.label}
                </span>
                <span className="ml-auto text-stone-400 group-hover:text-[#0f5f5c]" aria-hidden>&rarr;</span>
              </Link>
            ))}
          </div>

          <h3 className="mt-10 text-lg font-black text-[#173f3b]">
            Injury Treatment
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SS_INJURY_NAV.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className="group flex items-center gap-3 rounded border border-stone-200 bg-stone-50 px-4 py-3 transition hover:border-[#0f5f5c]/30 hover:bg-[#0f5f5c]/5"
              >
                <span className="text-sm font-bold text-[#173f3b] group-hover:text-[#0f5f5c]">
                  {i.label}
                </span>
                <span className="ml-auto text-stone-400 group-hover:text-[#0f5f5c]" aria-hidden>&rarr;</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick links row */}
        <section className="grid gap-6 sm:grid-cols-2">
          <Link
            href="/sulphur-springs/patient-resources"
            className="group border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
          >
            <h2 className="text-xl font-black text-[#173f3b] group-hover:underline">
              Patient Resources
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Helpful links and information about chiropractic care.
            </p>
          </Link>
          <Link
            href="/sulphur-springs/q-and-a"
            className="group border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
          >
            <h2 className="text-xl font-black text-[#173f3b] group-hover:underline">
              Questions &amp; Answers
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Common questions about chiropractic treatment answered.
            </p>
          </Link>
        </section>

        {/* Location info */}
        <section id="location" className="scroll-mt-32 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">
            Location &amp; Hours
          </h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4 text-stone-700">
              <div>
                <h3 className="font-bold text-[#173f3b]">Address</h3>
                {ss.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <a
                  href={ss.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm font-semibold text-[#0f5f5c] hover:underline"
                >
                  Get directions &rarr;
                </a>
              </div>
              <div>
                <h3 className="font-bold text-[#173f3b]">Phone</h3>
                <a
                  href={telHref(ss.phonePrimary)}
                  className="text-lg font-bold text-[#0f5f5c] hover:underline"
                >
                  {ss.phonePrimary}
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-[#173f3b]">Office Hours</h3>
              <table className="mt-2 text-sm text-stone-700">
                <tbody>
                  {(
                    [
                      ["Monday", "9:00 AM – 5:00 PM"],
                      ["Tuesday", "9:00 AM – 5:00 PM"],
                      ["Wednesday", "9:00 AM – 5:00 PM"],
                      ["Thursday", "9:00 AM – 5:00 PM"],
                      ["Friday", "9:00 AM – 5:00 PM"],
                      ["Saturday", "Closed"],
                      ["Sunday", "Closed"],
                    ] as const
                  ).map(([day, hours]) => (
                    <tr key={day}>
                      <td className="pr-6 py-1 font-medium">{day}</td>
                      <td className={hours === "Closed" ? "text-stone-400" : ""}>
                        {hours}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <CtaCard
          title="Ready for relief?"
          body="Book an appointment online or give us a call — we're here to help you feel better and move better."
          primary={{ label: "Book online", href: "/book" }}
          secondary={{
            label: "Call 903-919-5020",
            href: telHref(ss.phonePrimary),
          }}
        />
      </div>
    </>
  );
}
