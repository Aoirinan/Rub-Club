import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LOCATION_LIST, telHref } from "@/lib/constants";
import { IMAGES } from "@/lib/home-images";
import {
  CHIRO,
  CHIRO_INTRO_VIDEO_SRC,
  DOCTORS,
  MASSAGE,
} from "@/lib/home-verbatim";
import { GIFT_CARD_ORDER_URL } from "@/lib/constants";
import { getMassageTeamForMarketing } from "@/lib/massage-team";
import { JsonLd } from "@/components/JsonLd";
import { HomeVideo } from "@/components/HomeVideo";
import { FaqList } from "@/components/FaqList";
import { MassageTeamGrid } from "@/components/marketing/MassageTeamGrid";
import { TestimonialVideosSection } from "@/components/TestimonialVideosSection";
import { AdjustmentsInActionSection } from "@/components/AdjustmentsInActionSection";
import {
  chiropractorJsonLd,
  faqPageJsonLd,
  massageJsonLd,
} from "@/lib/structured-data";
import { LOCATIONS } from "@/lib/constants";
import { TESTIMONIALS } from "@/lib/testimonials";
import { HOME_FAQS } from "@/lib/faqs";
import { siteDescription, siteTitle } from "@/lib/site-content";

export const metadata: Metadata = {
  title: { absolute: siteTitle },
  description: siteDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    type: "website",
  },
};

export default async function Home() {
  const massageTeam = await getMassageTeamForMarketing();
  return (
    <div className="bg-[#f4f2ea]">
      <JsonLd
        data={[
          chiropractorJsonLd(LOCATIONS.paris),
          chiropractorJsonLd(LOCATIONS.sulphur_springs),
          massageJsonLd(),
          faqPageJsonLd(HOME_FAQS),
        ]}
      />
      <section className="relative min-h-[440px] overflow-hidden bg-[#0f5f5c]">
        <Image
          src={IMAGES.massageHeroBanner}
          alt="Calm massage room at The Rub Club"
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
            Massage Therapy &amp; Chiropractic Care in Paris &amp; Sulphur Springs, TX
          </h1>
          <p className="mt-4 max-w-xl text-xl font-semibold text-white/95">{CHIRO.spineSub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="focus-ring bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] shadow hover:bg-[#e6c13d]"
            >
              Book Online
            </Link>
            <a
              className="focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[#173f3b]"
              href={telHref("903-739-9959")}
            >
              Call 903-739-9959
            </a>
          </div>
        </div>
      </section>

      <div className="bg-[#fff7d7] py-3 text-center text-sm text-[#5a4a15]">
        <strong>Voted Best Chiropractic Center &amp; Best Massage</strong> &mdash; The Paris News reader polls.
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12">
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
              href: GIFT_CARD_ORDER_URL,
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
              <Link
                href="/services/massage"
                className="focus-ring inline-flex bg-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
              >
                Explore massage services
              </Link>
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
          id="chiropractic-associates"
          className="scroll-mt-32 space-y-10 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <h2 className="text-3xl font-black text-[#173f3b]">{CHIRO.chooseTitle}</h2>
              <p className="leading-relaxed text-stone-700">{CHIRO.chooseLead}</p>
              <p className="leading-relaxed text-stone-700">{CHIRO.chooseP2}</p>
              <ul className="list-disc space-y-2 pl-6 text-stone-700">
                {CHIRO.conditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <Link
                href="/services/chiropractic"
                className="focus-ring inline-flex bg-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
              >
                Explore chiropractic care
              </Link>
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
        </section>

        <section
          aria-labelledby="testimonials"
          className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
        >
          <h2 id="testimonials" className="text-3xl font-black text-[#173f3b]">
            What our patients say
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Paraphrased from public reviews — read more or leave your own on{" "}
            <Link className="font-bold text-[#0f5f5c] underline" href="/reviews">
              our reviews page
            </Link>
            .
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.slice(0, 3).map((t) => (
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
            Meet the doctors who lead care at Chiropractic Associates in Paris and Sulphur Springs.
          </p>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {DOCTORS.map((member) => (
              <article
                key={member.name}
                className="flex flex-col overflow-hidden border border-stone-200 bg-stone-50 shadow-sm"
              >
                <div className="relative aspect-[3/4] w-full bg-stone-200">
                  <Image
                    src={IMAGES[member.imageKey]}
                    alt={`Portrait of ${member.name}, ${member.role}`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-black text-[#173f3b]">{member.name}</h3>
                  <p className="text-sm font-bold text-stone-600">{member.role}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-700">{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <AdjustmentsInActionSection />

        <MassageTeamGrid
          members={massageTeam}
          title="Meet the Team"
          subtitle="Massage therapy — The Rub Club"
          variant="home"
        />

        <section className="grid gap-8 overflow-hidden border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md lg:grid-cols-2 lg:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-black text-[#173f3b]">{MASSAGE.spineTitle}</h2>
            <p className="mt-4 leading-relaxed text-stone-700">{MASSAGE.spineBody}</p>
            <Link
              href={MASSAGE.spineHref}
              className="focus-ring mt-6 inline-flex bg-[#0f5f5c] px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow hover:bg-[#0f817b]"
            >
              {MASSAGE.spineCta}
            </Link>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <Image
              src={IMAGES.spine3d}
              alt="3D Spine Simulator preview"
              fill
              className="object-cover shadow-md ring-1 ring-black/10"
              sizes="(max-width: 1024px) 100vw, 400px"
            />
          </div>
        </section>

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
            <FaqList entries={HOME_FAQS} />
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
              <dl className="mt-4 space-y-2 text-sm">
                {MASSAGE.hours.map((row) => (
                  <div
                    key={row.day}
                    className="flex justify-between gap-4 border-b border-white/10 py-2"
                  >
                    <dt className="font-bold">{row.day}</dt>
                    <dd>{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="space-y-6 text-sm text-white/85">
              <h3 className="text-lg font-black text-[#f2d25d]">{MASSAGE.locationTitle}</h3>
              {LOCATION_LIST.map((loc) => (
                <div key={loc.id}>
                  <p className="text-base font-black text-white">{loc.name}</p>
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
            <Link
              href="/book"
              className="focus-ring bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] shadow hover:bg-[#e6c13d]"
            >
              Book online
            </Link>
            <Link
              href="/contact"
              className="focus-ring border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[#173f3b]"
            >
              Contact us
            </Link>
          </div>
        </section>

        <p className="border-t border-stone-300 pt-8 text-center text-xs text-stone-600">
          Online booking on this site collects only your contact details and preferred visit time so
          the office can confirm your appointment. We do not collect insurance or medical records
          here. Please do not share protected health information through the contact form.
        </p>
      </div>
    </div>
  );
}
