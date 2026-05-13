import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { telHref, LOCATIONS } from "@/lib/constants";
import {
  SS_SERVICE_NAV,
  SS_INJURY_NAV,
} from "@/lib/sulphur-springs-content";

const ss = LOCATIONS.sulphur_springs;

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

const quickLinks = [
  {
    href: "/sulphur-springs/staff",
    label: "Meet the Staff",
    description: "Dr. Conner Collins and the Sulphur Springs care team.",
  },
  {
    href: "/sulphur-springs/adjustments-and-manipulation",
    label: "Services",
    description:
      "Adjustments, spinal decompression, acupuncture, therapeutic exercise, and more.",
  },
  {
    href: "/sulphur-springs/patient-resources",
    label: "Patient Resources",
    description: "Helpful links and information about chiropractic care.",
  },
  {
    href: "/sulphur-springs/q-and-a",
    label: "Q & A",
    description: "Common questions about chiropractic treatment answered.",
  },
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

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        {/* Quick links */}
        <section className="grid gap-6 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
            >
              <h2 className="text-xl font-black text-[#173f3b] group-hover:underline">
                {link.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {link.description}
              </p>
            </Link>
          ))}
        </section>

        {/* Services */}
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Our Services</h2>
          <ul className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {SS_SERVICE_NAV.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="text-[#0f5f5c] underline decoration-[#0f5f5c]/30 hover:decoration-[#0f5f5c]"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-lg font-black text-[#173f3b]">
            Injury Treatment
          </h3>
          <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {SS_INJURY_NAV.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className="text-[#0f5f5c] underline decoration-[#0f5f5c]/30 hover:decoration-[#0f5f5c]"
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Location info */}
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
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
                  Get directions →
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
