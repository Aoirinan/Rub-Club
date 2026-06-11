import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { BOOKING_DISABLED_TITLE } from "@/lib/public-booking";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export type Crumb = { name: string; url: string };

export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav
        aria-label="Breadcrumb"
        className="mx-auto max-w-6xl px-4 pt-6 text-xs text-stone-600"
      >
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((c, idx) => {
            const last = idx === items.length - 1;
            return (
              <li key={c.url} className="flex items-center gap-1">
                {last ? (
                  <span className="font-semibold text-stone-900">{c.name}</span>
                ) : (
                  <Link className="hover:underline" href={c.url}>
                    {c.name}
                  </Link>
                )}
                {!last ? <span aria-hidden>›</span> : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/** Backpro-style full-width page-title banner: dark teal band, gold eyebrow + accent bar. */
export function PageHero({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="relative mb-8 mt-4 overflow-hidden bg-gradient-to-r from-[#0c3937] via-[#173f3b] to-[#0f5f5c]">
      <div
        aria-hidden
        className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#0f817b]/20 blur-2xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f2d25d]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow sm:text-5xl">
          {title}
        </h1>
        <div aria-hidden className="mt-4 h-1 w-16 bg-[#f2d25d]" />
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
    "focus-ring bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d]";
  const secondaryClass =
    "focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[#173f3b]";

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
    <section className="border-t-4 border-[#0f5f5c] bg-[#173f3b] px-6 py-10 text-white shadow-md sm:px-10">
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
