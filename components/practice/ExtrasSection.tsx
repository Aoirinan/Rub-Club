import Link from "next/link";
import { renderRichText } from "@/lib/cms-registry";
import type { PracticeExtra } from "@/lib/practice-pages-shared";

function hasContent(extra: PracticeExtra): boolean {
  return (
    extra.heading.trim().length > 0 ||
    extra.body.trim().length > 0 ||
    extra.links.length > 0
  );
}

function ExtraCard({ extra }: { extra: PracticeExtra }) {
  return (
    <section className="border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-8">
      {extra.heading.trim() ? (
        <h2 className="text-xl font-black text-[var(--pp-heading)]">{extra.heading}</h2>
      ) : null}
      {extra.body.trim() ? (
        <div
          className="mt-3 max-w-3xl leading-relaxed text-stone-700"
          dangerouslySetInnerHTML={{ __html: renderRichText(extra.body) }}
        />
      ) : null}
      {extra.links.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {extra.links.map((l) => (
            <li key={`${l.label}-${l.url}`}>
              <Link
                href={l.url}
                className="font-bold text-[var(--pp-accent)] underline hover:text-[var(--pp-accent-hover)]"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {extra.ctaLabel.trim() && extra.ctaUrl.trim() ? (
        <Link
          href={extra.ctaUrl}
          className="focus-ring mt-4 inline-flex bg-[var(--pp-accent)] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white hover:bg-[var(--pp-accent-hover)]"
        >
          {extra.ctaLabel}
        </Link>
      ) : null}
    </section>
  );
}

/** Location-specific promo/link blocks (wellness plans, awards, injuries, resources…). */
export function ExtrasSection({ extras }: { extras: PracticeExtra[] }) {
  const visible = extras.filter((e) => e.published && hasContent(e));
  if (visible.length === 0) return null;
  return (
    <>
      {visible.map((extra) => (
        <ExtraCard key={extra.id} extra={extra} />
      ))}
    </>
  );
}
