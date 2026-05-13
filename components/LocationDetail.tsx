import Link from "next/link";
import type { LocationInfo } from "@/lib/constants";
import { telHref, reviewUrlForLocation } from "@/lib/constants";
import { MASSAGE } from "@/lib/home-verbatim";

export function LocationDetail({ location }: { location: LocationInfo }) {
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(
    `${location.streetAddress}, ${location.addressLocality}, ${location.addressRegion} ${location.postalCode}`,
  )}&output=embed`;
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
      <section className="grid gap-8 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-[#173f3b]">Visit us</h2>
          <address className="not-italic">
            <p className="font-bold text-[#173f3b]">{location.name}</p>
            {location.addressLines.map((line) => (
              <p key={line} className="text-stone-700">
                {line}
              </p>
            ))}
          </address>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-bold text-[#173f3b]">Office: </span>
              <a className="focus-ring font-bold text-[#0f5f5c] underline" href={telHref(location.phonePrimary)}>
                {location.phonePrimary}
              </a>
            </p>
            {location.phoneSecondary ? (
              <p>
                <span className="font-bold text-[#173f3b]">Massage desk: </span>
                <a
                  className="focus-ring font-bold text-[#0f5f5c] underline"
                  href={telHref(location.phoneSecondary)}
                >
                  {location.phoneSecondary}
                </a>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={location.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center gap-2 border-2 border-[#0f5f5c] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
            >
              Get directions
            </a>
            <a
              href={reviewUrlForLocation(location.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center gap-2 border-2 border-[#0f5f5c] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
            >
              Leave a Google review
            </a>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-black text-[#173f3b]">Office hours</h3>
          <dl className="space-y-1 text-sm">
            {MASSAGE.hours.map((row) => (
              <div
                key={row.day}
                className="flex justify-between gap-4 border-b border-stone-200 py-2 text-stone-700"
              >
                <dt className="font-bold text-[#173f3b]">{row.day}</dt>
                <dd>{row.hours}</dd>
              </div>
            ))}
          </dl>
          <Link
            href={`/book?location=${location.id}`}
            className="focus-ring inline-flex bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d]"
          >
            Book at this location
          </Link>
        </div>
      </section>

      <section className="overflow-hidden border-t-4 border-[#0f5f5c] bg-white shadow-md">
        <div className="aspect-[16/9] w-full">
          <iframe
            title={`Map of ${location.name}`}
            src={mapEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0"
            allowFullScreen
          />
        </div>
      </section>
    </div>
  );
}
