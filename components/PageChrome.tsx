import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
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
    <header className="mx-auto max-w-6xl px-4 pb-8 pt-6">
      {eyebrow ? (
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0f5f5c]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 text-4xl font-black tracking-tight text-[#173f3b] sm:text-5xl">
        {title}
      </h1>
      {lede ? (
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-700">{lede}</p>
      ) : null}
    </header>
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
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="border-t-4 border-[#0f5f5c] bg-[#173f3b] px-6 py-10 text-white shadow-md sm:px-10">
      <h2 className="text-2xl font-black">{title}</h2>
      {body ? <p className="mt-3 max-w-2xl text-white/90">{body}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={primary.href}
          className="focus-ring bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d]"
        >
          {primary.label}
        </Link>
        {secondary ? (
          <a
            className="focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[#173f3b]"
            href={secondary.href}
          >
            {secondary.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}
