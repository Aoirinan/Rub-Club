import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { ContactForm } from "@/components/ContactForm";
import { SectionHeading } from "@/components/practice/SectionHeading";
import { practiceThemeStyle } from "@/components/practice/theme";
import { getPageBrand } from "@/lib/page-business-theme";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { organizationJsonLd } from "@/lib/structured-data";
import { getParisOfficeHours } from "@/lib/office-hours";
import { OfficeHoursTable } from "@/components/OfficeHoursTable";
import { getContentMany } from "@/lib/cms";
import {
  contactAppointmentCopy,
  getPublicBookingConfig,
  isPublicBookingEnabled,
} from "@/lib/public-booking-settings";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Contact — Chiropractic Associates, Paris, TX",
  description:
    "Phone number, address, and hours for The Rub Club and Chiropractic Associates in Paris, TX. Send a message or call us directly.",
  path: "/contact",
  ogTitle: "Contact — Chiropractic Associates, Paris",
  ogDescription:
    "Phone, hours, and contact form for our Paris, TX office. Sulphur Springs has its own contact page.",
});

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
      <path d="M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" />
    </svg>
  );
}

export default async function ContactPage() {
  const [c, bookingConfig, parisHours, displayLocs, brand] = await Promise.all([
    getContentMany(["contact_heading", "contact_subtext"]),
    getPublicBookingConfig(),
    getParisOfficeHours(),
    getDisplayLocations(),
    getPageBrand(),
  ]);
  // Paris-only contact page; Sulphur Springs has its own at /sulphur-springs/contact.
  const paris = displayLocs.paris;
  const locationList = [paris];

  return (
    <div className="bg-[#f4f2ea]" style={practiceThemeStyle(brand.loc)}>
      <JsonLd data={organizationJsonLd(locationList)} />
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Locations", url: "/contact" }]} />

      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 pt-10">
        {/* Header */}
        <section>
          <SectionHeading>{c.contact_heading?.trim() || "Contact Us"}</SectionHeading>
          {c.contact_subtext?.trim() ? (
            <p className="mx-auto mt-5 max-w-3xl text-center leading-relaxed text-stone-500">
              {c.contact_subtext}
            </p>
          ) : null}
        </section>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          {/* Left column: office info + hours */}
          <div className="space-y-6">
            <section className="rounded-xl border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-8">
              <h2 className="text-xl font-black text-[var(--pp-heading)]">{paris.name}</h2>
              <div className="mt-4 space-y-3 text-sm text-stone-700">
                <p className="flex items-center gap-2">
                  <span className="text-[var(--pp-accent)]">
                    <PhoneIcon />
                  </span>
                  <a className="focus-ring font-bold hover:underline" href={telHref(paris.phonePrimary)}>
                    {paris.phonePrimary}
                  </a>
                </p>
                {paris.phoneSecondary ? (
                  <p className="flex items-center gap-2">
                    <span className="text-[var(--pp-accent)]">
                      <PhoneIcon />
                    </span>
                    <a className="focus-ring font-bold hover:underline" href={telHref(paris.phoneSecondary)}>
                      {paris.phoneSecondary}
                    </a>
                    <span className="text-xs text-stone-500">(massage desk)</span>
                  </p>
                ) : null}
                <p className="flex items-start gap-2">
                  <span className="mt-0.5 text-[var(--pp-accent)]">
                    <PinIcon />
                  </span>
                  <a
                    href={paris.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring hover:underline"
                  >
                    {paris.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </a>
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={paris.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex bg-[var(--pp-cta)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[var(--pp-cta-hover)]"
                >
                  Get Directions
                </a>
                <Link
                  href={`/locations/${paris.slug}`}
                  className="focus-ring inline-flex border-2 border-[var(--pp-accent)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--pp-accent)] hover:bg-[var(--pp-accent)]/5"
                >
                  Location Details
                </Link>
              </div>
            </section>

            <section className="rounded-xl border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-8">
              <h2 className="text-xl font-black text-[var(--pp-heading)]">Hours</h2>
              <div className="mt-4">
                <OfficeHoursTable
                  rows={parisHours}
                  rowClassName="flex justify-between gap-3 border-b border-stone-200 py-1.5 text-sm"
                />
              </div>
            </section>
          </div>

          {/* Right column: message form */}
          <section
            id="send-message"
            className="scroll-mt-24 rounded-xl border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-8"
          >
            <h2 className="text-xl font-black text-[var(--pp-heading)]">Send Us a Message</h2>
            <p className="mt-2 text-sm text-stone-700">
              {contactAppointmentCopy(isPublicBookingEnabled(bookingConfig))}
            </p>
            <div className="mt-5">
              <ContactForm location="paris" variant={brand.variant} />
            </div>
            <div className="mt-5 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-bold">Privacy notice</p>
              <p className="mt-1">
                Please don&rsquo;t share sensitive health information through this form. For
                anything medical, please call us directly. See our{" "}
                <Link className="font-bold underline" href="/website-privacy">
                  website privacy policy
                </Link>
                .
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
