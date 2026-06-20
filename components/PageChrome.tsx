import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { BOOKING_DISABLED_TITLE } from "@/lib/public-booking";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export type Crumb = { name: string; url: string };

export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  // Structured data only — visible trail removed; main nav covers wayfinding.
  return <JsonLd data={breadcrumbJsonLd(items)} />;
}

export type BrandVariant = "paris" | "sulphur";

// Colors come from CSS vars set on <body> (lib/brand-theme.ts), which managers
// edit in Practice pages -> Theme colors. Hex fallbacks match the defaults.
const HERO_BAND: Record<BrandVariant, { band: string; blob: string }> = {
  paris: {
    band: "linear-gradient(to right, var(--brand-paris-heading,#4a1515), var(--brand-paris-heading,#4a1515), var(--brand-paris-accent,#c0392b))",
    blob: "bg-[var(--brand-paris-accent-hover,#962d22)] opacity-20",
  },
  sulphur: {
    band: "linear-gradient(to right, var(--brand-ss-heading,#0c2d3a), var(--brand-ss-heading,#0c2d3a), var(--brand-ss-accent,#2980b9))",
    blob: "bg-[var(--brand-ss-accent-hover,#1a6da3)] opacity-20",
  },
};

/** Backpro-style full-width page-title banner: dark brand band, gold eyebrow + accent bar. */
export function PageHero({
  eyebrow,
  title,
  lede,
  variant = "paris",
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  variant?: BrandVariant;
}) {
  const colors = HERO_BAND[variant];
  return (
    <header
      className="relative mb-8 mt-4 overflow-hidden"
      style={{ backgroundImage: colors.band }}
    >
      <div
        aria-hidden
        className={`absolute -right-16 -top-20 h-64 w-64 rounded-full blur-2xl ${colors.blob}`}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f19f1f]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow sm:text-5xl">
          {title}
        </h1>
        <div aria-hidden className="mt-4 h-1 w-16 bg-[#f19f1f]" />
        {lede ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/90">{lede}</p>
        ) : null}
      </div>
    </header>
  );
}

function CtaButton({
  href,
  label,
  variant,
}: {
  href: string | null;
  label: string;
  variant: "primary" | "secondary";
}) {
  const primaryClass =
    "focus-ring bg-[var(--brand-paris-cta,#4a1515)] px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[var(--brand-paris-cta-hover,#341010)]";
  const secondaryClass =
    "focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[var(--brand-paris-heading,#4a1515)]";

  if (!href) {
    return (
      <span
        className={`${variant === "primary" ? primaryClass : secondaryClass} cursor-not-allowed opacity-75`}
        aria-disabled="true"
        title={BOOKING_DISABLED_TITLE}
      >
        {label}
      </span>
    );
  }

  if (variant === "primary") {
    return (
      <Link href={href} className={primaryClass}>
        {label}
      </Link>
    );
  }

  return (
    <a className={secondaryClass} href={href}>
      {label}
    </a>
  );
}

export function CtaCard({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body?: string;
  primary: { label: string; href: string | null };
  secondary?: { label: string; href: string | null };
}) {
  return (
    <section className="border-t-4 border-[var(--brand-paris-accent,#c0392b)] bg-[var(--brand-paris-heading,#4a1515)] px-6 py-10 text-white shadow-md sm:px-10">
      <h2 className="text-2xl font-black">{title}</h2>
      {body ? <p className="mt-3 max-w-2xl text-white/90">{body}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <CtaButton href={primary.href} label={primary.label} variant="primary" />
        {secondary ? (
          <CtaButton href={secondary.href} label={secondary.label} variant="secondary" />
        ) : null}
      </div>
    </section>
  );
}
