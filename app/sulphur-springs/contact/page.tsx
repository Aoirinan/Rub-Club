import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { OfficeHoursTable } from "@/components/OfficeHoursTable";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { chiropractorJsonLd } from "@/lib/structured-data";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { getContentMany } from "@/lib/cms";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Contact us — Chiropractic Associates of Sulphur Springs",
  description:
    "Phone number, address, and hours for Chiropractic Associates of Sulphur Springs at 207 Jefferson St. E. Call 903-919-5020.",
  path: "/sulphur-springs/contact",
  ogTitle: "Contact Chiropractic Associates of Sulphur Springs",
  ogDescription: "Phone, hours, and directions for our Sulphur Springs, TX office. Call 903-919-5020.",
});

export default async function SulphurSpringsContactPage() {
  const [c, ssHours, displayLocs] = await Promise.all([
    getContentMany(["ss_contact_heading", "ss_contact_subtext"]),
    getSulphurOfficeHours(),
    getDisplayLocations(),
  ]);
  const ss = displayLocs.sulphur_springs;

  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(
    `${ss.streetAddress}, ${ss.addressLocality}, ${ss.addressRegion} ${ss.postalCode}`,
  )}&output=embed`;

  return (
    <>
      <JsonLd data={chiropractorJsonLd(ss)} />
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: "Contact", url: "/sulphur-springs/contact" },
        ]}
      />
      <PageHero
        variant="sulphur"
        eyebrow="Chiropractic Associates · Sulphur Springs"
        title={c.ss_contact_heading}
        lede={c.ss_contact_subtext}
      />

      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
        <section className="grid gap-8 border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-black text-[#0c2d3a]">{ss.name}</h2>
            <address className="not-italic text-sm text-stone-700">
              {ss.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p className="text-sm">
              <span className="font-bold text-[#0c2d3a]">Office: </span>
              <a className="focus-ring font-bold text-[#2980b9] underline" href={telHref(ss.phonePrimary)}>
                {ss.phonePrimary}
              </a>
            </p>
            {ss.fax?.trim() ? (
              <p className="text-sm text-stone-700">
                <span className="font-bold text-[#0c2d3a]">Fax: </span>
                {ss.fax}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <a
                href={ss.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-2 border-2 border-[#2980b9] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#2980b9] hover:bg-[#0c2d3a]/5"
              >
                Get directions
              </a>
              <Link
                href="/locations/sulphur-springs"
                className="focus-ring inline-flex items-center gap-2 border-2 border-[#2980b9] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#2980b9] hover:bg-[#0c2d3a]/5"
              >
                Location details
              </Link>
            </div>
          </div>
          <div className="overflow-hidden border border-stone-200">
            <div className="aspect-[4/3] w-full lg:h-full lg:aspect-auto">
              <iframe
                title={`Map of ${ss.name}`}
                src={mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#0c2d3a]">Office hours</h2>
          <div className="mt-4 max-w-md">
            <OfficeHoursTable
              rows={ssHours}
              rowClassName="flex justify-between gap-3 border-b border-stone-200 py-1"
            />
          </div>
        </section>
      </div>
    </>
  );
}
