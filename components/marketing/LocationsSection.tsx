import Link from "next/link";
import { LOCATIONS } from "@/lib/constants";
import { MASSAGE } from "@/lib/home-verbatim";
import { BookingCta } from "@/components/BookingCta";

type Props = {
  titleAs?: "h1" | "h2";
  /** Shorter block for the home page with a link to the full locations page. */
  compact?: boolean;
};

export function LocationsSection({ titleAs = "h2", compact = false }: Props) {
  const TitleTag = titleAs;

  return (
    <section id="locations" className="scroll-mt-32 space-y-8 bg-[#173f3b] p-6 text-white shadow-xl sm:p-10">
      <TitleTag className="text-2xl font-black">{MASSAGE.contactTitle}</TitleTag>

      {compact ? (
        <div className="max-w-2xl space-y-4 text-white/90">
          <p>
            Main office:{" "}
            <strong className="text-white">{MASSAGE.rubClubAddressLines.join(", ")}</strong>. Chiropractic:{" "}
            <a className="font-bold text-[#f2d25d] hover:underline" href="tel:9037855551">
              903-785-5551
            </a>
            . Massage desk:{" "}
            <a className="font-bold text-[#f2d25d] hover:underline" href="tel:9037399959">
              903-739-9959
            </a>
            .
          </p>
          <p>
            <Link className="inline-flex font-black text-[#f2d25d] underline hover:text-white" href="/locations">
              View all hours, Sulphur Springs, and maps
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-black text-[#f2d25d]">{MASSAGE.hoursTitle}</h2>
            <p className="mt-1 text-sm text-white/80">{MASSAGE.hoursSubtitle}</p>
            <dl className="mt-4 space-y-2 text-sm">
              {MASSAGE.hours.map((row) => (
                <div key={row.day} className="flex justify-between gap-4 border-b border-white/10 py-2">
                  <dt className="font-bold">{row.day}</dt>
                  <dd>{row.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-lg font-black text-[#f2d25d]">{MASSAGE.locationTitle}</h2>
            <p className="mt-4 text-xl font-black">{MASSAGE.rubClubAddressTitle}</p>
            <p className="mt-2 text-teal-50">
              <span className="block font-bold">Address</span>
              {MASSAGE.rubClubAddressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p className="mt-4">
              <span className="block text-sm font-bold text-[#f2d25d]">Contact Information</span>
              <a className="text-lg font-black hover:underline" href="tel:9037399959">
                903-739-9959
              </a>
            </p>
            <div className="mt-8 space-y-4 border-t border-white/15 pt-6 text-sm text-white/80">
              {Object.entries(LOCATIONS).map(([id, loc]) => (
                <div key={id}>
                  <p className="font-black text-white">{loc.name}</p>
                  <p className="mt-1">
                    {loc.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                  <a
                    className="mt-1 inline-block font-bold text-[#f2d25d] hover:underline"
                    href={`tel:${loc.phonePrimary.replaceAll("-", "")}`}
                  >
                    {loc.phonePrimary}
                  </a>
                  {loc.phoneSecondary ? (
                    <p className="mt-1">
                      Massage desk:{" "}
                      <a
                        className="font-bold text-[#f2d25d] hover:underline"
                        href={`tel:${loc.phoneSecondary.replaceAll("-", "")}`}
                      >
                        {loc.phoneSecondary}
                      </a>
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-white/15 pt-6">
        <BookingCta label="Book online" />
      </div>
    </section>
  );
}
