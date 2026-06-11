import Image from "next/image";
import Link from "next/link";
import { BookingCta } from "@/components/BookingCta";
import { PracticeHeroSlides } from "@/components/practice/PracticeHeroSlides";
import { telHref } from "@/lib/constants";
import type { PracticeHeroSection } from "@/lib/practice-pages-shared";

const CTA_CLASS =
  "focus-ring bg-[var(--pp-accent)] px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow hover:bg-[var(--pp-accent-hover)]";

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
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--pp-hero-from)] via-[var(--pp-hero-via)] to-transparent" />
      <div className="relative mx-auto flex min-h-[400px] max-w-6xl flex-col justify-center px-4 py-16 text-white">
        {data.eyebrow.trim() ? (
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--pp-eyebrow)]">
            {data.eyebrow}
          </p>
        ) : null}
        <Heading className="mt-3 max-w-xl text-4xl font-black leading-tight drop-shadow sm:text-5xl">
          {data.heading}
        </Heading>
        {data.tagline.trim() ? (
          <p className="mt-4 max-w-lg text-lg text-white/90">{data.tagline}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          {data.ctaUrl.trim() ? (
            <Link href={data.ctaUrl} className={CTA_CLASS}>
              {data.ctaLabel || "Request Appointment"}
            </Link>
          ) : (
            <BookingCta label={data.ctaLabel || "Request Appointment"} className={CTA_CLASS} />
          )}
          {data.callPhone.trim() ? (
            <a
              className="focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[var(--pp-heading)]"
              href={telHref(data.callPhone)}
            >
              Call {data.callPhone}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
