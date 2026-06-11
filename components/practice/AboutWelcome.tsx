import Image from "next/image";
import Link from "next/link";
import { renderRichText } from "@/lib/cms-registry";
import { telHref } from "@/lib/constants";
import type { PracticeAboutBlock } from "@/lib/practice-pages-shared";

/** Two-column welcome block: rich text (+ optional bullets) beside a photo, with phone/link CTAs. */
export function AboutWelcome({
  data,
  phone,
}: {
  data: PracticeAboutBlock;
  /** Location phone for the CTA button. */
  phone: string;
}) {
  if (!data.published) return null;
  if (!data.heading.trim() && !data.body.trim()) return null;

  const paragraphs = data.body.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const hasImage = data.imageUrl.trim().length > 0;
  const remote = /^https?:\/\//i.test(data.imageUrl);

  return (
    <section
      className={`grid gap-10 border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10 ${
        hasImage ? "lg:grid-cols-2" : ""
      }`}
    >
      <div className="space-y-4">
        {data.heading.trim() ? (
          <h2 className="text-3xl font-black text-[var(--pp-heading)]">{data.heading}</h2>
        ) : null}
        {paragraphs.map((p, idx) => (
          <div
            key={`about-${idx}`}
            className="leading-relaxed text-stone-700"
            dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
          />
        ))}
        {data.bullets.length > 0 ? (
          <ul className="list-disc space-y-2 pl-6 text-stone-700">
            {data.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {(phone.trim() && data.phoneCtaLabel.trim()) ||
        (data.ctaLabel.trim() && data.ctaUrl.trim()) ? (
          <div className="flex flex-wrap items-start gap-3 pt-2">
            {phone.trim() && data.phoneCtaLabel.trim() ? (
              <a
                href={telHref(phone)}
                className="focus-ring inline-flex flex-col items-center gap-0.5 rounded-lg border-2 border-[var(--pp-accent)] px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-[var(--pp-accent)] hover:bg-stone-50"
              >
                <span>{data.phoneCtaLabel}</span>
                <span className="text-sm font-bold normal-case tracking-normal">{phone}</span>
              </a>
            ) : null}
            {data.ctaLabel.trim() && data.ctaUrl.trim() ? (
              <Link
                href={data.ctaUrl}
                className="focus-ring inline-flex border-2 border-[var(--pp-accent)] px-5 py-3 text-sm font-black uppercase tracking-wide text-[var(--pp-accent)] hover:bg-stone-50"
              >
                {data.ctaLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
      {hasImage ? (
        <div className="relative aspect-[3/2] overflow-hidden shadow-lg lg:min-h-[320px]">
          <Image
            src={data.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            unoptimized={remote}
          />
        </div>
      ) : null}
    </section>
  );
}
