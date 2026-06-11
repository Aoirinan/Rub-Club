import Image from "next/image";
import Link from "next/link";
import { BookingCta } from "@/components/BookingCta";
import { PracticeHeroSlides } from "@/components/practice/PracticeHeroSlides";
import { telHref } from "@/lib/constants";
import type { PracticeHeroSection } from "@/lib/practice-pages-shared";

const CTA_CLASS =
  "focus-ring bg-[#25455e] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow hover:bg-[#1b3649]";

/** Full-width photo hero with practice heading, tagline, and book/call CTAs. */
export function PracticeHero({
  data,
  headingTag = "h1",
}: {
  data: PracticeHeroSection;
  headingTag?: "h1" | "h2";
}) {
  if (!data.published || !data.heading.trim()) return null;
  const Heading = headingTag;
  const remote = /^https?:\/\//i.test(data.imageUrl);
  const slides = [data.imageUrl, ...data.slides].filter((s) => s.trim().length > 0);

  return (
    <section className="relative min-h-[400px] overflow-hidden bg-[var(--pp-hero-overlay)]">
      {slides.length > 1 ? (
        <PracticeHeroSlides images={slides} />
      ) : data.imageUrl.trim() ? (
        <Image
          src={data.imageUrl}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
          unoptimized={remote}
        />
      ) : null}
      {/* Backpro-style angled translucent panel anchored to the left edge. */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#2e6655e6] via-[#2e6655cc] to-transparent sm:w-[68%] sm:[clip-path:polygon(0_0,100%_0,72%_100%,0_100%)] sm:bg-none sm:bg-[#2e6655d9]"
      />
      <div className="relative mx-auto flex min-h-[400px] max-w-6xl flex-col justify-center px-4 py-16 text-white">
        <div className="max-w-xl">
          {data.eyebrow.trim() ? (
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/85">
              {data.eyebrow}
            </p>
          ) : null}
          <Heading className="mt-3 text-4xl font-bold leading-tight drop-shadow sm:text-5xl">
            {data.heading}
          </Heading>
          {data.callPhone.trim() ? (
            <p className="mt-5 text-base">
              <span className="font-bold">Call or Text Us Today:</span>{" "}
              <a className="focus-ring font-semibold underline-offset-2 hover:underline" href={telHref(data.callPhone)}>
                {data.callPhone}
              </a>
            </p>
          ) : null}
          {data.tagline.trim() ? (
            <p className="mt-2 max-w-lg text-base text-white/90">{data.tagline}</p>
          ) : null}
          <div className="mt-7 flex flex-wrap gap-3">
            {data.ctaUrl.trim() ? (
              <Link href={data.ctaUrl} className={CTA_CLASS}>
                {data.ctaLabel || "Appointments"}
              </Link>
            ) : (
              <BookingCta label={data.ctaLabel || "Appointments"} className={CTA_CLASS} />
            )}
            {data.callPhone.trim() ? (
              <a className={CTA_CLASS} href={telHref(data.callPhone)}>
                Call {data.callPhone}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
