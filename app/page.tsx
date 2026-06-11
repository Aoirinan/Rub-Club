import { buildPageMetadata } from "@/lib/page-metadata";
import Image from "next/image";
import Link from "next/link";
import { telHref } from "@/lib/constants";
import { IMAGES } from "@/lib/home-images";
import {
  CHIRO,
  CHIRO_INTRO_VIDEO_SRC,
  MASSAGE,
} from "@/lib/home-verbatim";
import { getMassageTeamForMarketing } from "@/lib/massage-team";
import { JsonLd } from "@/components/JsonLd";
import { HomeVideo } from "@/components/HomeVideo";
import { BookingCta } from "@/components/BookingCta";
import { FaqList } from "@/components/FaqList";
import { MassageTeamGrid } from "@/components/marketing/MassageTeamGrid";
import { TestimonialVideosSection } from "@/components/TestimonialVideosSection";
import { AdjustmentsInActionSection } from "@/components/AdjustmentsInActionSection";
import { ChiropracticDoctorCard } from "@/components/ChiropracticDoctorCard";
import {
  chiropractorJsonLd,
  faqPageJsonLd,
  massageJsonLd,
} from "@/lib/structured-data";
import { HOME_PAGE_TESTIMONIALS } from "@/lib/testimonials";
import { getContentMany, parseConditionsList, renderRichText } from "@/lib/cms";
import { DOCTOR_CMS_KEYS, getDoctorsForMarketing } from "@/lib/cms-doctors";
import { HOME_INTRO } from "@/lib/home-verbatim";
import { getLayoutCmsContent } from "@/lib/cms-display";
import { getParisOfficeHours } from "@/lib/office-hours";
import { OfficeHoursTable } from "@/components/OfficeHoursTable";
import { getActiveFaqs } from "@/lib/site-faqs";
import { getSiteOwnerConfig } from "@/lib/site-owner-config";
import { effectiveGiftCardUrl, mergedDisplayLocations } from "@/lib/site-display-overrides";
import { siteDescription, siteTitle } from "@/lib/site-content";
import { pageKeywords } from "@/lib/seo-keywords";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: siteTitle,
  brandInTitle: true,
  description: siteDescription,
  path: "/",
  keywords: pageKeywords(),
});

export default async function Home() {
  const [cmsLayout, parisHours] = await Promise.all([getLayoutCmsContent(), getParisOfficeHours()]);
  const c = await getContentMany([
    "home_hero_heading",
    "home_hero_subheading",
    "home_hero_cta_label",
    "home_awards_text",
    "home_about_blurb",
    "home_testimonials_heading",
    "home_testimonials_intro",
    "chiro_choose_title",
    "chiro_intro_body",
    "chiro_conditions_list",
    ...DOCTOR_CMS_KEYS,
  ]);
  const homeFaqs = (await getActiveFaqs()).slice(0, 5);
  const chooseParagraphs = (c.chiro_intro_body ?? "").split(/\n\n+/).filter(Boolean);
  const chooseConditions = parseConditionsList(c.chiro_conditions_list ?? "");

  let displayLocs = mergedDisplayLocations(undefined, cmsLayout);
  let giftHref = effectiveGiftCardUrl(undefined, cmsLayout);
  let awardsHtml: string | null = null;
  let doctorMedia: Awaited<ReturnType<typeof getSiteOwnerConfig>>["doctorMedia"] = [];
  try {
    const cfg = await getSiteOwnerConfig();
    displayLocs = mergedDisplayLocations(cfg.editableCopy, cmsLayout);
    giftHref = effectiveGiftCardUrl(cfg.editableCopy, cmsLayout);
    const a = cfg.editableCopy.awardsStripHtml.trim();
    if (a) awardsHtml = a;
    doctorMedia = cfg.doctorMedia;
  } catch {
    /* keep defaults */
  }
  const homeLocList = [displayLocs.paris, displayLocs.sulphur_springs] as const;
  const [massageTeam, doctors] = await Promise.all([
    getMassageTeamForMarketing(),
    getDoctorsForMarketing(c, doctorMedia),
  ]);
  return (
    <div className="bg-[#f4f2ea]">
      <JsonLd
        data={[
          chiropractorJsonLd(displayLocs.paris),
          chiropractorJsonLd(displayLocs.sulphur_springs),
          massageJsonLd(displayLocs.paris),
          faqPageJsonLd(homeFaqs),
        ]}
      />
      <section className="relative min-h-[440px] overflow-hidden bg-[#0f5f5c]">
        <Image
          src={IMAGES.chiroBg}
          alt="Chiropractic care at Chiropractic Associates in Paris, TX"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c3937]/90 via-[#0c3937]/55 to-transparent" />
        <div className="relative mx-auto flex min-h-[440px] max-w-6xl flex-col justify-center px-4 py-16 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#f2d25d]">
            {CHIRO.spineHeadline}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black leading-tight drop-shadow sm:text-5xl">
            {c.home_hero_heading}
          </h1>
          <p className="mt-4 max-w-xl text-xl font-semibold text-white/95">{c.home_hero_subheading}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BookingCta
              label="Book chiropractic"
              query="service=chiropractic"
              className="focus-ring bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] shadow hover:bg-[#e6c13d]"
            />
            <BookingCta
              label={c.home_hero_cta_label || "Book massage"}
              query="service=massage&location=paris"
              className="focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[#173f3b]"
            />
            <a
              className="focus-ring border-2 border-white/80 px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white/10"
              href={telHref(displayLocs.paris.phonePrimary)}
            >
              Call chiro {displayLocs.paris.phonePrimary}
            </a>
          </div>
        </div>
      </section>

      <div className="bg-[#fff7d7] py-3 text-center text-sm text-[#5a4a15]">
        {awardsHtml ? (
          <div
            className="mx-auto max-w-4xl px-2 [&_a]:font-bold [&_a]:text-[#5a4a15] [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: awardsHtml }}
          />
        ) : (
          <>
            {c.home_awards_text}
          </>
        )}
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">{HOME_INTRO.title}</h2>
          <div
            className="mt-4 max-w-3xl leading-relaxed text-stone-700"
            dangerouslySetInnerHTML={{ __html: renderRichText(c.home_about_blurb) }}
          />
        </section>

        <section aria-label="Featured services" className="grid gap-4 md:grid-cols-5">
          {[
            {
              label: "DEEP TISSUE MASSAGE",
              href: "/services/massage",
              img: IMAGES.serviceDeepTissue,
              alt: "Deep tissue massage at The Rub Club",
            },
            {
              label: "PRE-NATAL MASSAGE",
              href: "/services/massage",
              img: IMAGES.servicePrenatal,
              alt: "Prenatal massage at The Rub Club",
            },
            {
              label: "CHIROPRACTIC CARE",
              href: "/services/chiropractic",
              img: IMAGES.massageChiroTile,
              alt: "Chiropractic adjustment at Chiropractic Associates",
            },
            {
              label: "SPORTS MASSAGE",
              href: "/services/massage",
              img: IMAGES.serviceSports,
              alt: "Sports massage at The Rub Club",
            },
            {
              label: "GIFT CARDS",
              href: giftHref,
              img: IMAGES.rubClubLogo,
              alt: "The Rub Club gift cards",
              external: true,
            },
          ].map((tile) =>
            tile.external ? (
              <a
                key={tile.label}
                href={tile.href}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring group relative flex min-h-[220px] flex-col justify-end overflow-hidden bg-[#173f3b] p-5 text-white shadow-lg"
              >
                <Image
                  src={tile.img}
                  alt={tile.alt}
                  fill
                  className="object-contain p-8 transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span className="relative text-base font-black tracking-wide">{tile.label}</span>
                <span className="relative mt-1 text-xs font-black uppercase tracking-wide text-[#f2d25d] group-hover:underline">
                  BUY ON SQUARE
                </span>
              </a>
            ) : (
              <Link
                key={tile.label}
                href={tile.href}
                className="focus-ring group relative flex min-h-[220px] flex-col justify-end overflow-hidden bg-[#173f3b] p-5 text-white shadow-lg"
              >
                <Image
                  src={tile.img}
                  alt={tile.alt}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span className="relative text-base font-black tracking-wide">{tile.label}</span>
                <span className="relative mt-1 text-xs font-black uppercase tracking-wide text-[#f2d25d] group-hover:underline">
                  LEARN MORE
                </span>
              </Link>
            ),
          )}
        </section>

        <TestimonialVideosSection />

        <section
          id="chiropractic-associates"
          className="scroll-mt-32 space-y-10 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <h2 className="text-3xl font-black text-[#173f3b]">{c.chiro_choose_title}</h2>
              {chooseParagraphs.map((p, idx) => (
                <p
                  key={`choose-${idx}`}
                  className="leading-relaxed text-stone-700"
                  dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
                />
              ))}
              <ul className="list-disc space-y-2 pl-6 text-stone-700">
                {chooseConditions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <BookingCta
                  label="Book chiropractic"
                  query="service=chiropractic"
                  variant="teal"
                />
                <Link
                  href="/services/chiropractic"
                  className="focus-ring inline-flex border-2 border-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
                >
                  Explore chiropractic care
                </Link>
              </div>
            </div>
            <div className="relative aspect-[3/2] overflow-hidden shadow-lg lg:min-h-[320px]">
              <Image
                src={IMAGES.chiroBg}
                alt="A chiropractor adjusting a patient at Chiropractic Associates"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <HomeVideo src={CHIRO_INTRO_VIDEO_SRC} heading={CHIRO.introVideoHeading} />

          <div className="rounded-lg border border-[#0f5f5c]/20 bg-[#f8f8f6] p-5">
            <h3 className="text-lg font-black text-[#173f3b]">
              {CHIRO.stretchCallPart1} {CHIRO.stretchCallPart2}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">{CHIRO.stretchP1}</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">{CHIRO.stretchP2}</p>
            <BookingCta
              label="Book Stretch & Flex Rehab"
              query="service=stretch"
              variant="teal"
              className="focus-ring mt-4 inline-flex bg-[#0f5f5c] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
            />
          </div>
        </section>

        <section
          id="the-rub-club"
          className="scroll-mt-32 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
        >
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-5">
              <h2 className="text-3xl font-black text-[#173f3b]">{MASSAGE.stressTitle}</h2>
              {MASSAGE.stressParas.map((p) => (
                <p key={p} className="leading-relaxed text-stone-700">
                  {p}
                </p>
              ))}
              <div className="flex flex-wrap gap-3">
                <BookingCta
                  label="Book massage"
                  query="service=massage&location=paris"
                  variant="teal"
                />
                <Link
                  href="/services/massage"
                  className="focus-ring inline-flex border-2 border-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
                >
                  Explore massage services
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden shadow-md lg:aspect-auto lg:min-h-[360px]">
              <Image
                src={IMAGES.massagePatient}
                alt="A licensed massage therapist working with a client at The Rub Club"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="testimonials"
          className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
        >
          <h2 id="testimonials" className="text-3xl font-black text-[#173f3b]">
            {c.home_testimonials_heading}
          </h2>
          <div
            className="mt-2 text-sm text-stone-600 [&_a]:font-bold [&_a]:text-[#0f5f5c] [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: renderRichText(c.home_testimonials_intro) }}
          />
          <p className="mt-2 text-sm text-stone-600">
            Read more or leave your own on{" "}
            <Link className="font-bold text-[#0f5f5c] underline" href="/reviews">
              our reviews page
            </Link>
            .
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {HOME_PAGE_TESTIMONIALS.map((t) => (
              <figure
                key={t.quote}
                className="flex h-full flex-col justify-between border border-stone-200 bg-stone-50 p-5"
              >
                <blockquote className="text-sm italic leading-relaxed text-stone-700">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 border-t border-stone-200 pt-3 text-xs">
                  <span className="font-bold text-[#173f3b]">{t.author}</span>
                  {t.context ? <span className="block text-stone-600">{t.context}</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          id="our-chiropractors"
          className="scroll-mt-32 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
        >
          <h2 className="text-center text-3xl font-black text-[#173f3b]">Our Chiropractors</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center leading-relaxed text-stone-700">
            Dr. Greg Thompson, Dr. Sean Welborn, and Dr. Brandy Collins serve our Paris office.{" "}
            <Link href="/sulphur-springs/staff" className="font-bold text-[#0f5f5c] underline">
              Dr. Conner Collins
            </Link>{" "}
            leads care in Sulphur Springs.
          </p>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((member) => (
              <ChiropracticDoctorCard
                key={member.name}
                name={member.name}
                role={member.role}
                bio={member.bio}
                imageSrc={member.imageSrc}
                videoUrl={member.videoUrl}
                videoFile={member.videoFile}
                actionVideos={member.actionVideos}
              />
            ))}
          </div>
        </section>

        <AdjustmentsInActionSection />

        <MassageTeamGrid
          members={massageTeam}
          title="Meet the Team"
          subtitle="Massage therapy — The Rub Club"
          variant="home"
          footnote={
            <>
              Titles here reflect massage therapy roles. Insurance, personal injury, front desk, and
              other Paris office roles are on{" "}
              <Link href="/locations/paris/staff" className="font-bold text-[#0f5f5c] underline">
                our Paris office team page
              </Link>
              .
            </>
          }
        />

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#173f3b]">Insurance &amp; billing</h2>
              <p className="mt-2 max-w-2xl text-stone-700">
                We accept many major medical plans for chiropractic visits and file claims on your
                behalf. Massage therapy is generally self-pay. Call to verify your benefits.
              </p>
            </div>
            <Link
              href="/insurance"
              className="focus-ring inline-flex border-2 border-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
            >
              Insurance details
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="home-faq"
          className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="home-faq" className="text-2xl font-black text-[#173f3b]">
              Frequently asked questions
            </h2>
            <Link
              href="/faq"
              className="focus-ring text-sm font-bold text-[#0f5f5c] underline"
            >
              See all FAQs
            </Link>
          </div>
          <div className="mt-4">
            <FaqList entries={homeFaqs} />
          </div>
        </section>

        <section
          id="locations"
          className="scroll-mt-32 space-y-8 bg-[#173f3b] p-6 text-white shadow-xl sm:p-10"
        >
          <h2 className="text-2xl font-black">{MASSAGE.contactTitle}</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-black text-[#f2d25d]">{MASSAGE.hoursTitle}</h3>
              <p className="mt-1 text-sm text-white/80">{MASSAGE.hoursSubtitle}</p>
              <OfficeHoursTable
                rows={parisHours}
                dayClassName="font-bold text-white"
                hoursClassName="text-white/90"
                rowClassName="flex justify-between gap-4 border-b border-white/10 py-2 text-sm"
              />
            </div>
            <div className="space-y-6 text-sm text-white/85">
              <h3 className="text-lg font-black text-[#f2d25d]">{MASSAGE.locationTitle}</h3>
              {homeLocList.map((loc) => (
                <div key={loc.id}>
                  <p className="text-base font-black text-white">
                    {loc.id === "paris" ? "Paris TX" : "Sulphur Springs"}
                  </p>
                  <p className="mt-1">
                    {loc.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                  <a
                    className="mt-1 inline-block font-bold text-[#f2d25d] hover:underline"
                    href={telHref(loc.phonePrimary)}
                  >
                    {loc.phonePrimary}
                  </a>
                  {loc.phoneSecondary ? (
                    <p className="mt-1">
                      Massage desk:{" "}
                      <a
                        className="font-bold text-[#f2d25d] hover:underline"
                        href={telHref(loc.phoneSecondary)}
                      >
                        {loc.phoneSecondary}
                      </a>
                    </p>
                  ) : null}
                  <Link
                    href={`/locations/${loc.slug}`}
                    className="mt-1 inline-block text-xs font-bold uppercase tracking-wide text-[#f2d25d] hover:underline"
                  >
                    Map &amp; details &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-white/15 pt-6">
            <BookingCta label="Book Now" />
            <Link
              href="/contact"
              className="focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[#173f3b]"
            >
              Contact us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
