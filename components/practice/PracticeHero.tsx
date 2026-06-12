import Image from "next/image";
import Link from "next/link";
import { BookingCta } from "@/components/BookingCta";
import { PracticeHeroSlides } from "@/components/practice/PracticeHeroSlides";
import { SocialIcon } from "@/components/practice/UtilityBar";
import { telHref } from "@/lib/constants";
import type { PracticeHeroSection, PracticeUtilityBar } from "@/lib/practice-pages-shared";

const CTA_CLASS =
  "focus-ring bg-[var(--pp-cta)] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow hover:bg-[var(--pp-cta-hover)]";

const MOBILE_BTN_CLASS =
  "focus-ring block w-full rounded-md bg-[var(--pp-accent)] px-4 py-3 text-center text-sm font-bold text-white shadow hover:bg-[var(--pp-accent-hover)]";

/** Full-width photo hero with practice heading, tagline, and book/call CTAs. */
export function PracticeHero({
  data,
  utility,
  headingTag = "h1",
}: {
  data: PracticeHeroSection;
  /** Utility bar data (maps URL + social links) for the mobile button stack. */
  utility?: PracticeUtilityBar;
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
        className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[var(--pp-hero-panel-from)] via-[var(--pp-hero-panel-via)] to-transparent sm:w-[68%] sm:[clip-path:polygon(0_0,100%_0,72%_100%,0_100%)]"
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
          {/* Desktop / tablet: inline rectangle CTAs inside the angled panel. */}
          <div className="mt-7 hidden flex-wrap gap-3 sm:flex">
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

          {/* Mobile: Backpro-style stacked full-width buttons + social circles. */}
          <div className="mt-6 space-y-3 sm:hidden">
            {data.callPhone.trim() ? (
              <a className={MOBILE_BTN_CLASS} href={telHref(data.callPhone)}>
                Call or Text Us: {data.callPhone}
              </a>
            ) : null}
            {utility?.mapsUrl.trim() ? (
              <a
                className={MOBILE_BTN_CLASS}
                href={utility.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions
              </a>
            ) : null}
            {data.ctaUrl.trim() ? (
              <Link href={data.ctaUrl} className={MOBILE_BTN_CLASS}>
                {data.ctaLabel || "Schedule an Appointment"}
              </Link>
            ) : (
              <BookingCta
                label={data.ctaLabel || "Schedule an Appointment"}
                className={MOBILE_BTN_CLASS}
              />
            )}
            {utility && utility.socialLinks.length > 0 ? (
              <div className="flex items-center justify-center gap-3 pt-1">
                {utility.socialLinks.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform || "Social link"}
                    className="focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pp-accent)] text-white shadow hover:bg-[var(--pp-accent-hover)]"
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
