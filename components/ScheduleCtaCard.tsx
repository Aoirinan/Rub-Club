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
  variant?: "paris" | "sulphur";
};

// Colors come from CSS vars set on <body> (lib/brand-theme.ts) — manager-editable.
const SECTION_CLASS = {
  paris:
    "border-t-4 border-[var(--brand-paris-accent,#c0392b)] bg-[var(--brand-paris-heading,#4a1515)]",
  sulphur:
    "border-t-4 border-[var(--brand-ss-accent,#2980b9)] bg-[var(--brand-ss-heading,#0c2d3a)]",
} as const;

const SECONDARY_CLASS = {
  paris:
    "focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[var(--brand-paris-heading,#4a1515)]",
  sulphur:
    "focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[var(--brand-ss-heading,#0c2d3a)]",
} as const;

/** Bottom CTA. Online booking is retired — the primary button pops the office phone number. */
export function ScheduleCtaCard({
  title,
  body,
  bookLabel = "Book Now",
  secondary,
  variant = "paris",
}: Props) {
  return (
    <section
      className={`${SECTION_CLASS[variant]} px-6 py-10 text-white shadow-md sm:px-10`}
    >
      <h2 className="text-2xl font-black">{title}</h2>
      {body ? <p className="mt-3 max-w-2xl text-white/90">{body}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <BookingCta label={bookLabel} variant="default" />
        {secondary ? (
          <a className={SECONDARY_CLASS[variant]} href={secondary.href}>
            {secondary.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}
