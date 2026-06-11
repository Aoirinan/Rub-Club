import type { LocationInfo } from "@/lib/constants";
import { telHref } from "@/lib/constants";
import { OfficeHoursTable } from "@/components/OfficeHoursTable";
import { getContentMany } from "@/lib/cms";
import type { OfficeHoursRow } from "@/lib/office-hours";

/**
 * "Our Location" + "Office Hours" strip repeated across subpages,
 * mirroring the block the legacy Sulphur Springs site showed on every page.
 * Headings are manager-editable (Footer → Location & hours sections).
 */
export async function LocationHoursSection({
  location,
  hours,
  accent = "#0f5f5c",
}: {
  location: LocationInfo;
  hours: readonly OfficeHoursRow[];
  /** Border/link accent — SS blue (#2980b9) or Paris green (#0f5f5c). */
  accent?: string;
}) {
  const cms = await getContentMany(["location_section_heading", "hours_section_heading"]);
  const locationHeading = cms.location_section_heading?.trim() || "Our Location";
  const hoursHeading = cms.hours_section_heading?.trim() || "Office Hours";
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(
    `${location.streetAddress}, ${location.addressLocality}, ${location.addressRegion} ${location.postalCode}`,
  )}&output=embed`;

  return (
    <section
      className="grid gap-8 border-t-4 bg-white p-6 shadow-md sm:p-10 lg:grid-cols-2"
      style={{ borderTopColor: accent }}
    >
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wide text-[#173f3b]">{locationHeading}</h2>
        <address className="not-italic text-stone-700">{location.addressLines.join(" | ")}</address>
        <div className="overflow-hidden border border-stone-200">
          <div className="aspect-[4/3] w-full">
            <iframe
              title={`Map of ${location.name}`}
              src={mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
              allowFullScreen
            />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wide text-[#173f3b]">{hoursHeading}</h2>
        <p className="text-sm text-stone-600">Our General Schedule</p>
        <OfficeHoursTable rows={hours} />
        <a
          href={telHref(location.phonePrimary)}
          className="focus-ring inline-flex px-5 py-3 text-sm font-black uppercase tracking-wide text-white"
          style={{ backgroundColor: accent }}
        >
          Call {location.phonePrimary}
        </a>
      </div>
    </section>
  );
}
