import type { LocationInfo } from "@/lib/constants";
import { telHref } from "@/lib/constants";
import { BookingCta } from "@/components/BookingCta";
import { OfficeHoursTable } from "@/components/OfficeHoursTable";
import type { OfficeHoursRow } from "@/lib/office-hours";

export function LocationDetail({
  location,
  reviewUrl,
  officeHours,
}: {
  location: LocationInfo;
  reviewUrl: string;
  officeHours: readonly OfficeHoursRow[];
}) {
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(
    `${location.streetAddress}, ${location.addressLocality}, ${location.addressRegion} ${location.postalCode}`,
  )}&output=embed`;
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
      <section className="grid gap-8 border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-[#4a1515]">Visit us</h2>
          <address className="not-italic">
            <p className="font-bold text-[#4a1515]">{location.name}</p>
            {location.addressLines.map((line) => (
              <p key={line} className="text-stone-700">
                {line}
              </p>
            ))}
          </address>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-bold text-[#4a1515]">Office: </span>
              <a className="focus-ring font-bold text-[#c0392b] underline" href={telHref(location.phonePrimary)}>
                {location.phonePrimary}
              </a>
            </p>
            {location.phoneSecondary ? (
              <p>
                <span className="font-bold text-[#4a1515]">Massage desk: </span>
                <a
                  className="focus-ring font-bold text-[#c0392b] underline"
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
              className="focus-ring inline-flex items-center gap-2 border-2 border-[#c0392b] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#c0392b] hover:bg-[#4a1515]/5"
            >
              Get directions
            </a>
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center gap-2 border-2 border-[#c0392b] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#c0392b] hover:bg-[#4a1515]/5"
            >
              Leave a Google review
            </a>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-black text-[#4a1515]">Office hours</h3>
          <OfficeHoursTable rows={officeHours} />
          <BookingCta
            label="Book at this location"
            query={`location=${location.id}`}
          />
        </div>
      </section>

      <section className="overflow-hidden border-t-4 border-[#c0392b] bg-white shadow-md">
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
