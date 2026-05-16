import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { ContactForm } from "@/components/ContactForm";
import { LOCATION_LIST, telHref } from "@/lib/constants";
import { organizationJsonLd } from "@/lib/structured-data";
import { MASSAGE } from "@/lib/home-verbatim";
import { contactAppointmentCopy } from "@/lib/public-booking";

export const metadata: Metadata = {
  title: "Contact us — Paris & Sulphur Springs offices",
  description:
    "Phone numbers, addresses, and hours for The Rub Club and Chiropractic Associates in Paris and Sulphur Springs, TX. Send a message or call us directly.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact The Rub Club & Chiropractic Associates",
    description:
      "Phone, hours, and contact form for our Paris and Sulphur Springs, TX offices.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }]} />
      <PageHero
        eyebrow="We're here to help"
        title="Contact us"
        lede="Call the office that's most convenient, or send us a message and we will follow up during office hours."
      />

      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
        <section className="grid gap-6 sm:grid-cols-2">
          {LOCATION_LIST.map((loc) => (
            <article
              key={loc.id}
              className="space-y-4 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md"
            >
              <h2 className="text-xl font-black text-[#173f3b]">{loc.name}</h2>
              <address className="not-italic text-sm text-stone-700">
                {loc.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-bold text-[#173f3b]">Office: </span>
                  <a className="focus-ring font-bold text-[#0f5f5c] underline" href={telHref(loc.phonePrimary)}>
                    {loc.phonePrimary}
                  </a>
                </p>
                {loc.phoneSecondary ? (
                  <p>
                    <span className="font-bold text-[#173f3b]">Massage desk: </span>
                    <a
                      className="focus-ring font-bold text-[#0f5f5c] underline"
                      href={telHref(loc.phoneSecondary)}
                    >
                      {loc.phoneSecondary}
                    </a>
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={loc.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center gap-2 border-2 border-[#0f5f5c] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
                >
                  Get directions
                </a>
                <Link
                  href={`/locations/${loc.slug}`}
                  className="focus-ring inline-flex items-center gap-2 border-2 border-[#0f5f5c] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
                >
                  Location details
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-8 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-black text-[#173f3b]">Send us a message</h2>
            <p className="mt-2 text-sm text-stone-700">
              {contactAppointmentCopy()}
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
          <aside className="space-y-4 text-sm">
            <div className="bg-stone-50 p-5 ring-1 ring-stone-200">
              <h3 className="text-base font-black text-[#173f3b]">Office hours</h3>
              <dl className="mt-3 space-y-1">
                {MASSAGE.hours.map((row) => (
                  <div key={row.day} className="flex justify-between gap-3 border-b border-stone-200 py-1">
                    <dt className="font-bold text-[#173f3b]">{row.day}</dt>
                    <dd>{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="text-sm font-bold">Privacy notice</p>
              <p className="mt-1 text-sm">
                Please don&rsquo;t share sensitive health information through this form. For
                anything medical, please call us directly.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </>
  );
}
