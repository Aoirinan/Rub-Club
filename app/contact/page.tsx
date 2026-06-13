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
  const locationList = [displayLocs.paris];

  return (
    <div className="bg-[#f4f2ea]" style={practiceThemeStyle(brand.loc)}>
      <JsonLd data={organizationJsonLd(locationList)} />
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Locations", url: "/contact" }]} />

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-10">
        {/* Backpro-style contact header */}
        <section>
          <SectionHeading>{c.contact_heading?.trim() || "Contact Us"}</SectionHeading>
          {c.contact_subtext?.trim() ? (
            <p className="mx-auto mt-5 max-w-3xl text-center leading-relaxed text-stone-500">
              {c.contact_subtext}
            </p>
          ) : null}

          <h2 className="mt-10 text-center text-2xl font-semibold text-[var(--pp-accent)]">
            Information
          </h2>
          <div className="mx-auto mt-6 grid max-w-md gap-8">
            {locationList.map((loc) => {
              // Brand each office by location so the Sulphur Springs side reads
              // as blue and the Paris side as red. Falls back to the defaults.
              const isSs = loc.slug === "sulphur-springs";
              const accent = isSs
                ? "text-[var(--brand-ss-accent,#2980b9)]"
                : "text-[var(--brand-paris-accent,#c0392b)]";
              const cta = isSs
                ? "bg-[var(--brand-ss-cta,#0c2d3a)] hover:bg-[var(--brand-ss-cta-hover,#081f29)]"
                : "bg-[var(--brand-paris-cta,#4a1515)] hover:bg-[var(--brand-paris-cta-hover,#341010)]";
              const contactHref = isSs ? "/sulphur-springs/contact" : "#send-message";
              return (
              <article key={loc.id} className="space-y-3 text-center sm:text-left">
                <h3 className={`text-lg font-bold ${accent}`}>{loc.name}</h3>
                <p className="flex items-center justify-center gap-2 text-sm text-stone-700 sm:justify-start">
                  <span className={accent}>
                    <PhoneIcon />
                  </span>
                  <a className="focus-ring font-bold hover:underline" href={telHref(loc.phonePrimary)}>
                    {loc.phonePrimary}
                  </a>
                </p>
                {loc.phoneSecondary ? (
                  <p className="flex items-center justify-center gap-2 text-sm text-stone-700 sm:justify-start">
                    <span className={accent}>
                      <PhoneIcon />
                    </span>
                    <a
                      className="focus-ring font-bold hover:underline"
                      href={telHref(loc.phoneSecondary)}
                    >
                      {loc.phoneSecondary}
                    </a>
                    <span className="text-xs text-stone-500">(massage desk)</span>
                  </p>
                ) : null}
                <p className="flex items-start justify-center gap-2 text-sm text-stone-700 sm:justify-start">
                  <span className={`mt-0.5 ${accent}`}>
                    <PinIcon />
                  </span>
                  <a
                    href={loc.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring hover:underline"
                  >
                    {loc.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </a>
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-1 sm:justify-start">
                  <Link
                    href={contactHref}
                    className={`focus-ring inline-flex px-4 py-2 text-xs font-bold uppercase tracking-wide text-white ${cta}`}
                  >
                    Contact Us
                  </Link>
                  <a
                    href={loc.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`focus-ring inline-flex px-4 py-2 text-xs font-bold uppercase tracking-wide text-white ${cta}`}
                  >
                    Get Directions
                  </a>
                  <Link
                    href={`/locations/${loc.slug}`}
                    className={`focus-ring inline-flex px-4 py-2 text-xs font-bold uppercase tracking-wide text-white ${cta}`}
                  >
                    Location Details
                  </Link>
                </div>
              </article>
              );
            })}
          </div>
        </section>

        {/* Hours */}
        <section>
          <SectionHeading>Hours</SectionHeading>
          <div className="mx-auto mt-8 max-w-xl rounded-xl bg-white p-6 shadow-md">
            <OfficeHoursTable
              rows={parisHours}
              rowClassName="flex justify-between gap-3 border-b border-stone-200 py-1.5"
            />
          </div>
        </section>

        {/* Message form */}
        <section id="send-message" className="scroll-mt-24">
          <SectionHeading>Send Us a Message</SectionHeading>
          <div className="mx-auto mt-8 grid max-w-4xl gap-8 rounded-xl bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm text-stone-700">
                {contactAppointmentCopy(isPublicBookingEnabled(bookingConfig))}
              </p>
              <div className="mt-6">
                <ContactForm location="paris" variant={brand.variant} />
              </div>
            </div>
            <aside className="space-y-4 text-sm">
              <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="text-sm font-bold">Privacy notice</p>
                <p className="mt-1 text-sm">
                  Please don&rsquo;t share sensitive health information through this form. For
                  anything medical, please call us directly. See our{" "}
                  <Link className="font-bold underline" href="/website-privacy">
                    website privacy policy
                  </Link>
                  .
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
