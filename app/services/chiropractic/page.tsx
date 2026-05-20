import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { AdjustmentsInActionSection } from "@/components/AdjustmentsInActionSection";
import { BookingCta } from "@/components/BookingCta";
import { ChiropracticDoctorCard } from "@/components/ChiropracticDoctorCard";
import { ChiroTreatmentIcon } from "@/components/ChiroTreatmentIcon";
import { IMAGES } from "@/lib/home-images";
import { getContentMany, parseConditionsList, renderRichText } from "@/lib/cms";
import { DOCTOR_CMS_KEYS, getDoctorsForMarketing } from "@/lib/cms-doctors";
import { CHIRO_TREATMENT_OFFERINGS } from "@/lib/chiro-treatments";
import { CHIRO } from "@/lib/home-verbatim";
import { LOCATIONS, WELLNESS_CARE_PLANS_PATH, telHref } from "@/lib/constants";
import {
  getPublicBookingConfig,
  isPublicBookingEnabled,
  scheduleCtaHref,
  scheduleCtaLabel,
  scheduleMetaPhrase,
} from "@/lib/public-booking-settings";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { serviceBreadcrumbs } from "@/lib/service-breadcrumbs";
import { chiropractorJsonLd, serviceJsonLd } from "@/lib/structured-data";
import { siteUrl } from "@/lib/site-content";

const CHIRO_CMS_IDS = [
  "chiro_hero_heading",
  "chiro_hero_subheading",
  "chiro_intro_body",
  "chiro_conditions_list",
  "chiro_cta_heading",
  "chiro_cta_subtext",
  "chiro_testimonial_1_text",
  "chiro_testimonial_1_attr",
  "chiro_testimonial_2_text",
  "chiro_testimonial_2_attr",
  "chiro_testimonial_3_text",
  "chiro_testimonial_3_attr",
  "chiro_wellness_teaser_heading",
  "chiro_wellness_teaser_body",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const booking = await getPublicBookingConfig();
  const phrase = scheduleMetaPhrase(isPublicBookingEnabled(booking));
  return {
    title: "Chiropractor in Paris & Sulphur Springs, TX — Chiropractic Associates",
    description: `Chiropractic adjustments, spinal decompression, rehab, and acupuncture in Paris and Sulphur Springs, TX. ${phrase} — family-owned since 1998.`,
    alternates: { canonical: "/services/chiropractic" },
    openGraph: {
      title: "Chiropractor in Paris & Sulphur Springs, TX",
      description: `Adjustments, decompression, rehab, and acupuncture at Chiropractic Associates. ${phrase} either office.`,
      url: "/services/chiropractic",
    },
  };
}

export const revalidate = 60;

export default async function ChiropracticServicePage() {
  const booking = await getPublicBookingConfig();
  const massageHref = scheduleCtaHref(booking, "service=massage");
  const stretchHref = scheduleCtaHref(booking, "service=stretch");
  const c = await getContentMany([...CHIRO_CMS_IDS, ...DOCTOR_CMS_KEYS]);
  const doctors = await getDoctorsForMarketing(c);
  const paris = LOCATIONS.paris;
  const ss = LOCATIONS.sulphur_springs;
  const conditions = parseConditionsList(c.chiro_conditions_list ?? "");
  const introParagraphs = (c.chiro_intro_body ?? "").split(/\n\n+/).filter(Boolean);
  const testimonials = [
    { quote: c.chiro_testimonial_1_text, label: c.chiro_testimonial_1_attr },
    { quote: c.chiro_testimonial_2_text, label: c.chiro_testimonial_2_attr },
    { quote: c.chiro_testimonial_3_text, label: c.chiro_testimonial_3_attr },
  ].filter((t) => (t.quote ?? "").trim().length > 0);

  return (
    <>
      <JsonLd
        data={[
          chiropractorJsonLd(paris),
          chiropractorJsonLd(ss),
          serviceJsonLd({
            name: "Chiropractic Care",
            description:
              "Adjustments, spinal decompression, rehab exercises, electric stim, and acupuncture for back, neck, sciatica, and auto injuries.",
            url: siteUrl("/services/chiropractic"),
            serviceType: "Chiropractic",
            location: paris,
          }),
        ]}
      />
      <Breadcrumbs
        items={serviceBreadcrumbs({ name: "Chiropractic", url: "/services/chiropractic" })}
      />

      <PageHero
        eyebrow="Chiropractic Associates · Family-owned since 1998"
        title={c.chiro_hero_heading}
        lede={c.chiro_hero_subheading}
      />

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        <section className="grid gap-10 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#173f3b]">{CHIRO.chooseTitle}</h2>
            {introParagraphs.map((p, idx) => (
              <p
                key={`intro-${idx}`}
                className="leading-relaxed text-stone-700"
                dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
              />
            ))}
            <ul className="list-disc space-y-2 pl-6 text-stone-700">
              {conditions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
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
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Treatments We Combine</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-stone-700">{CHIRO.treatmentsIntro}</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CHIRO_TREATMENT_OFFERINGS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="text-[#0f5f5c]">
                  <ChiroTreatmentIcon name={t.name} />
                </div>
                <h3 className="mt-3 text-base font-black text-[#173f3b]">{t.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <AdjustmentsInActionSection />

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Our Paris chiropractors</h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Dr. Greg Thompson, Dr. Sean Welborn, and Dr. Brandy Collins practice at our Paris office.{" "}
            <Link href="/sulphur-springs/staff" className="font-bold text-[#0f5f5c] underline">
              Dr. Conner Collins
            </Link>{" "}
            leads care at our Sulphur Springs location.
          </p>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((member) => (
              <ChiropracticDoctorCard
                key={member.name}
                name={member.name}
                role={member.role}
                bio={member.bio}
                imageSrc={member.imageSrc}
                videoUrl={member.videoUrl}
                videoFile={member.videoFile}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="bg-white p-6 shadow ring-1 ring-[#0f5f5c]/15">
            <h3 className="text-base font-black uppercase tracking-wide text-[#173f3b]">
              {CHIRO.mainOfficeTitle}
            </h3>
            <p className="mt-3 leading-relaxed text-stone-700">
              {paris.streetAddress} — {paris.addressLocality}, {paris.addressRegion}. Chiropractic:{" "}
              <a className="font-bold text-[#0f5f5c] underline" href={telHref(paris.phonePrimary)}>
                {paris.phonePrimary}
              </a>
              .
            </p>
            <Link
              href={`/locations/${paris.slug}`}
              className="focus-ring mt-4 inline-block text-sm font-bold text-[#0f5f5c] underline"
            >
              Paris details &amp; hours
            </Link>
          </div>
          <div className="bg-white p-6 shadow ring-1 ring-[#0f5f5c]/15">
            <h3 className="text-base font-black uppercase tracking-wide text-[#173f3b]">
              {CHIRO.secondLocationTitle}
            </h3>
            <p className="mt-3 leading-relaxed text-stone-700">
              {ss.streetAddress} — {ss.addressLocality}, {ss.addressRegion}. Phone:{" "}
              <a className="font-bold text-[#0f5f5c] underline" href={telHref(ss.phonePrimary)}>
                {ss.phonePrimary}
              </a>
              .
            </p>
            <Link
              href={`/locations/${ss.slug}`}
              className="focus-ring mt-4 inline-block text-sm font-bold text-[#0f5f5c] underline"
            >
              Sulphur Springs details &amp; hours
            </Link>
          </div>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#173f3b]">{c.chiro_wellness_teaser_heading}</h2>
          <p className="mt-3 max-w-3xl text-stone-700">{c.chiro_wellness_teaser_body}</p>
          <Link
            href={WELLNESS_CARE_PLANS_PATH}
            className="focus-ring mt-4 inline-flex bg-[#0f5f5c] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
          >
            View wellness care plans
          </Link>
        </section>

        <p className="rounded border border-[#d8c061] bg-[#fff7d7] p-5 text-center text-sm text-[#5a4a15]">
          <strong>Awards: </strong>
          {CHIRO.awards}
        </p>

        {testimonials.length > 0 ? (
          <section className="bg-[#f8f8f6] px-4 py-12 sm:px-8">
            <h2 className="text-center text-2xl font-black text-[#173f3b]">
              What Our Chiropractic Patients Say
            </h2>
            <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-3">
              {testimonials.map((t, idx) => (
                <blockquote
                  key={`testimonial-${idx}-${(t.label ?? "").slice(0, 24)}`}
                  className="flex flex-col border-b-4 border-[#0f5f5c] bg-white p-6 shadow-sm"
                >
                  <p className="font-serif text-5xl leading-none text-[#0f5f5c]" aria-hidden>
                    &ldquo;
                  </p>
                  <p
                    className="mt-2 flex-1 text-stone-700"
                    dangerouslySetInnerHTML={{ __html: renderRichText(t.quote ?? "") }}
                  />
                  {t.label ? (
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      {t.label}
                    </p>
                  ) : null}
                </blockquote>
              ))}
            </div>
          </section>
        ) : null}

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">{c.chiro_cta_heading}</h2>
          <p className="mt-3 max-w-3xl text-stone-700">{c.chiro_cta_subtext}</p>
          <div className="mt-6 flex min-h-[56px] flex-col flex-wrap gap-3 sm:flex-row">
            <BookingCta
              label="Book chiropractic online"
              query="service=chiropractic"
              variant="teal"
              className="focus-ring flex min-h-[56px] flex-1 items-center justify-center rounded-lg bg-[#0f5f5c] px-4 py-3 text-center text-base font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
            />
            <a
              href={telHref(paris.phonePrimary)}
              className="focus-ring flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-[#0f5f5c] px-4 py-3 text-center text-base font-black text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
            >
              <span>Call Paris Office</span>
              <span className="text-sm font-bold">{paris.phonePrimary}</span>
            </a>
            <a
              href={telHref(ss.phonePrimary)}
              className="focus-ring flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-[#0f5f5c] px-4 py-3 text-center text-base font-black text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
            >
              <span>Call Sulphur Springs</span>
              <span className="text-sm font-bold">{ss.phonePrimary}</span>
            </a>
          </div>
          <p className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-center text-sm text-stone-600">
            <Link href={massageHref} className="font-semibold text-[#0f5f5c] underline hover:text-[#0f817b]">
              Massage appointments → {scheduleCtaLabel(booking, "Book online")}
            </Link>
            <span aria-hidden>·</span>
            <Link href={stretchHref} className="font-semibold text-[#0f5f5c] underline hover:text-[#0f817b]">
              Stretch &amp; Flex Rehab → {scheduleCtaLabel(booking, "Book online")}
            </Link>
            <span aria-hidden>·</span>
            <Link href="/patient-forms" className="font-semibold text-[#0f5f5c] underline hover:text-[#0f817b]">
              Patient forms
            </Link>
          </p>
        </section>

        <ScheduleCtaCard
          title="Questions before you book?"
          body="Our front desk can verify insurance for chiropractic visits and help you choose Paris or Sulphur Springs."
          query="service=chiropractic"
          secondary={{ label: `Call Paris ${paris.phonePrimary}`, href: telHref(paris.phonePrimary) }}
        />
      </div>
    </>
  );
}
