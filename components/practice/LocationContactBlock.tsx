import Link from "next/link";
import { OfficeHoursTable } from "@/components/OfficeHoursTable";
import { SectionHeading } from "@/components/practice/SectionHeading";
import { telHref } from "@/lib/constants";
import type { OfficeHoursRow } from "@/lib/office-hours";
import type { PracticeLocationBlockSection } from "@/lib/practice-pages-shared";

export type PracticeLocationInfo = {
  name: string;
  phoneLabel: string;
  phone: string;
  addressLines: string[];
  mapsUrl: string;
  /** Optional internal link below the address (e.g. /locations/paris). */
  detailsHref: string;
  detailsLabel: string;
};

export type PracticeSecondaryLocation = {
  title: string;
  lines: string[];
  phone: string;
  href: string;
  hrefLabel: string;
};

export type LocationContactHoursGroup = {
  label: string;
  rows: OfficeHoursRow[];
};

/** Office info + hours table + embedded map, with optional secondary-office cards. */
export function LocationContactBlock({
  data,
  location,
  hours,
  hoursLabel,
  additionalHours = [],
  secondaryLocations = [],
}: {
  data: PracticeLocationBlockSection;
  location: PracticeLocationInfo;
  hours: OfficeHoursRow[];
  /** Shown above `hours` only when there's more than one business's hours to distinguish. */
  hoursLabel?: string;
  /** Extra labeled hours blocks — e.g. a co-located business with a different schedule. */
  additionalHours?: LocationContactHoursGroup[];
  secondaryLocations?: PracticeSecondaryLocation[];
}) {
  if (!data.published) return null;

  const secondaries = data.showSecondaryLocations ? secondaryLocations : [];

  return (
    <section id="location-contact" className="scroll-mt-24 space-y-6">
      {secondaries.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {secondaries.map((s) => (
            <div key={s.title} className="bg-white p-6 shadow ring-1 ring-stone-200">
              <h3 className="text-base font-black uppercase tracking-wide text-[var(--pp-heading)]">
                {s.title}
              </h3>
              <p className="mt-3 leading-relaxed text-stone-700">
                {s.lines.join(", ")}
                {s.phone.trim() ? (
                  <>
                    {" — "}
                    <a
                      className="font-bold text-[var(--pp-accent)] underline"
                      href={telHref(s.phone)}
                    >
                      {s.phone}
                    </a>
                  </>
                ) : null}
              </p>
              {s.href.trim() ? (
                <Link
                  href={s.href}
                  className="focus-ring mt-4 inline-block text-sm font-bold text-[var(--pp-accent)] underline"
                >
                  {s.hrefLabel || "Details & hours"}
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-10 border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          {data.heading.trim() ? <SectionHeading>{data.heading}</SectionHeading> : null}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-[var(--pp-accent)]">
              {location.name}
            </h3>
            <p className="mt-2 font-bold text-[var(--pp-heading)]">
              {location.addressLines.join(", ")}
            </p>
            {location.phone.trim() ? (
              <a
                href={telHref(location.phone)}
                className="focus-ring mt-2 inline-block text-lg font-black text-[var(--pp-accent)] hover:underline"
              >
                {location.phoneLabel ? `${location.phoneLabel}: ` : ""}
                {location.phone}
              </a>
            ) : null}
            {location.detailsHref.trim() ? (
              <p className="mt-2">
                <Link
                  href={location.detailsHref}
                  className="focus-ring text-sm font-bold text-[var(--pp-accent)] underline"
                >
                  {location.detailsLabel || "Details & hours"}
                </Link>
              </p>
            ) : null}
          </div>
          {hours.length > 0 ? (
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-[var(--pp-accent)]">
                {hoursLabel ? `${hoursLabel} Hours` : "Office Hours"}
              </h3>
              <div className="mt-2 max-w-sm">
                <OfficeHoursTable
                  rows={hours}
                  dayClassName="font-medium text-stone-800"
                  rowClassName="flex justify-between gap-3 border-b border-stone-100 py-1 text-sm text-stone-700"
                />
              </div>
            </div>
          ) : null}
          {additionalHours.map((group) => (
            <div key={group.label}>
              <h3 className="text-sm font-black uppercase tracking-wide text-[var(--pp-accent)]">
                {group.label} Hours
              </h3>
              <div className="mt-2 max-w-sm">
                <OfficeHoursTable
                  rows={group.rows}
                  dayClassName="font-medium text-stone-800"
                  rowClassName="flex justify-between gap-3 border-b border-stone-100 py-1 text-sm text-stone-700"
                />
              </div>
            </div>
          ))}
        </div>
        {data.mapEmbedUrl.trim() ? (
          <div className="overflow-hidden border border-stone-200 bg-stone-100">
            <iframe
              src={data.mapEmbedUrl}
              title={`Map to ${location.name}`}
              width="600"
              height="400"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="h-[300px] w-full border-0 lg:h-full lg:min-h-[360px]"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
