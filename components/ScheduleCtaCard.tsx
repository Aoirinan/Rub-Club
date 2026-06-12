import { BookingCta } from "@/components/BookingCta";

type Props = {
  title: string;
  body?: string;
  bookLabel?: string;
  /** Retained for backward compatibility; no longer used (online booking retired). */
  contactLabel?: string;
  /** Retained for backward compatibility; no longer used (online booking retired). */
  query?: string;
  secondary?: { label: string; href: string };
};

const SECONDARY_CLASS =
  "focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[#4a1515]";

/** Bottom CTA. Online booking is retired â€” the primary button pops the office phone number. */
export function ScheduleCtaCard({ title, body, bookLabel = "Book Now", secondary }: Props) {
  return (
    <section className="border-t-4 border-[#c0392b] bg-[#4a1515] px-6 py-10 text-white shadow-md sm:px-10">
      <h2 className="text-2xl font-black">{title}</h2>
      {body ? <p className="mt-3 max-w-2xl text-white/90">{body}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <BookingCta label={bookLabel} variant="default" />
        {secondary ? (
          <a className={SECONDARY_CLASS} href={secondary.href}>
            {secondary.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}
