import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/practice/SectionHeading";
import { renderRichText } from "@/lib/cms-registry";
import { telHref } from "@/lib/constants";
import type { PracticeAboutBlock } from "@/lib/practice-pages-shared";

/** Two-column welcome block: rich text (+ optional bullets) beside a photo, with phone/link CTAs. */
export function AboutWelcome({
  data,
  phone,
  layout = "default",
}: {
  data: PracticeAboutBlock;
  /** Location phone for the CTA button. */
  phone: string;
  /**
   * "default": all copy sits in one column beside the image.
   * "intro-then-aside": intro paragraphs span full width, then the final
   * paragraph + bullets + CTAs sit beside the image.
   */
  layout?: "default" | "intro-then-aside";
}) {
  if (!data.published) return null;
  if (!data.heading.trim() && !data.body.trim()) return null;

  const paragraphs = data.body.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const hasImage = data.imageUrl.trim().length > 0;
  const remote = /^https?:\/\//i.test(data.imageUrl);

  const hasCta =
    (phone.trim() && data.phoneCtaLabel.trim()) ||
    (data.ctaLabel.trim() && data.ctaUrl.trim());

  const bullets =
    data.bullets.length > 0 ? (
      <ul className="list-disc space-y-2 pl-6 text-stone-700">
        {data.bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ) : null;

  const ctas = hasCta ? (
    <div className="flex flex-wrap items-start justify-center gap-3 pt-2 lg:justify-start">
      {phone.trim() && data.phoneCtaLabel.trim() ? (
        <a
          href={telHref(phone)}
          className="focus-ring inline-flex flex-col items-center gap-0.5 bg-[var(--pp-cta)] px-5 py-3 text-center text-sm font-bold uppercase tracking-wide text-white hover:bg-[var(--pp-cta-hover)]"
        >
          <span>{data.phoneCtaLabel}</span>
          <span className="text-sm font-bold normal-case tracking-normal">{phone}</span>
        </a>
      ) : null}
      {data.ctaLabel.trim() && data.ctaUrl.trim() ? (
        <Link
          href={data.ctaUrl}
          className="focus-ring inline-flex bg-[var(--pp-cta)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-[var(--pp-cta-hover)]"
        >
          {data.ctaLabel}
        </Link>
      ) : null}
    </div>
  ) : null;

  const image = hasImage ? (
    <div className="relative aspect-[3/2] overflow-hidden rounded-xl shadow-lg lg:min-h-[320px]">
      <Image
        src={data.imageUrl}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 50vw"
        unoptimized={remote}
      />
    </div>
  ) : null;

  // Intro paragraphs span full width, then the last paragraph + bullets + CTAs
  // sit next to the image.
  if (layout === "intro-then-aside" && hasImage) {
    const introParagraphs = paragraphs.slice(0, -1);
    const asideParagraph = paragraphs[paragraphs.length - 1];

    return (
      <section className="py-4">
        {data.heading.trim() ? <SectionHeading>{data.heading}</SectionHeading> : null}
        <div className="mt-8 space-y-4 text-center leading-relaxed text-stone-600 lg:text-left">
          {introParagraphs.map((p, idx) => (
            <div
              key={`about-intro-${idx}`}
              dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
            />
          ))}
        </div>
        <div className="mt-8 grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4 text-center lg:text-left">
            {asideParagraph ? (
              <div
                className="leading-relaxed text-stone-600"
                dangerouslySetInnerHTML={{ __html: renderRichText(asideParagraph) }}
              />
            ) : null}
            {bullets}
            {ctas}
          </div>
          {image}
        </div>
      </section>
    );
  }

  return (
    <section className="py-4">
      {data.heading.trim() ? <SectionHeading>{data.heading}</SectionHeading> : null}
      <div className={`mt-8 grid items-center gap-10 ${hasImage ? "lg:grid-cols-2" : ""}`}>
        <div className="space-y-4 text-center lg:text-left">
          {paragraphs.map((p, idx) => (
            <div
              key={`about-${idx}`}
              className="leading-relaxed text-stone-600"
              dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
            />
          ))}
          {bullets}
          {ctas}
        </div>
        {image}
      </div>
    </section>
  );
}
