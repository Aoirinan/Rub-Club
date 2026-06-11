import Image from "next/image";
import Link from "next/link";
import { AdjustmentsInActionSection } from "@/components/AdjustmentsInActionSection";
import { BookingCta } from "@/components/BookingCta";
import { ChiropracticDoctorCard } from "@/components/ChiropracticDoctorCard";
import { ChiroTreatmentIcon } from "@/components/ChiroTreatmentIcon";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { IMAGES } from "@/lib/home-images";
import { renderRichText } from "@/lib/cms";
import type { DoctorCmsEntry } from "@/lib/cms-doctors";
import type { ChiroTreatment } from "@/lib/chiro-treatments";
import { CHIRO } from "@/lib/home-verbatim";
import { WELLNESS_CARE_PLANS_PATH, telHref, type LocationInfo } from "@/lib/constants";
import {
  PARIS_CHIRO_SERVICE_NAV,
  parisChiroServiceSlugForName,
} from "@/lib/paris-chiro-services";
import type { PublicBookingConfig } from "@/lib/site-owner-config";

export type ChiroPageData = {
  chooseTitle: string;
  introParagraphs: string[];
  conditions: string[];
  doctors: DoctorCmsEntry[];
  doctorsHeading: string;
  doctorsIntro: string;
  treatmentsHeading: string;
  treatmentsIntro: string;
  treatments: ChiroTreatment[];
  testimonialsHeading: string;
  paris: LocationInfo;
  wellnessHeading: string;
  wellnessBody: string;
  ctaHeading: string;
  ctaSubtext: string;
  ctaParisLabel: string;
  ctaFormsLink: string;
  stretchLink: string;
  scheduleCtaTitle: string;
  scheduleCtaBody: string;
  scheduleCtaSecondary: string;
  testimonials: { quote: string; label: string }[];
  booking: PublicBookingConfig;
};

export function ChiroPageBlock({ id, data }: { id: string; data: ChiroPageData }) {
  switch (id) {
    case "intro":
      return (
        <section className="grid gap-10 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#173f3b]">{data.chooseTitle}</h2>
            {data.introParagraphs.map((p, idx) => (
              <div
                key={`intro-${idx}`}
                className="leading-relaxed text-stone-700"
                dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
              />
            ))}
            <ul className="list-disc space-y-2 pl-6 text-stone-700">
              {data.conditions.map((item) => (
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
      );
    case "treatments": {
      const cardSlugs = new Set(
        data.treatments
          .map((t) => parisChiroServiceSlugForName(t.name))
          .filter((s): s is string => Boolean(s)),
      );
      const moreTherapies = PARIS_CHIRO_SERVICE_NAV.filter(
        (s) => !cardSlugs.has(s.href.split("/").pop() ?? ""),
      );
      return (
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">{data.treatmentsHeading}</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-stone-700">{data.treatmentsIntro}</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.treatments.map((t, idx) => {
              const slug = parisChiroServiceSlugForName(t.name);
              const inner = (
                <>
                  <div className="text-[#0f5f5c]">
                    <ChiroTreatmentIcon name={t.name} />
                  </div>
                  <h3 className={`mt-3 text-base font-black text-[#173f3b] ${slug ? "group-hover:text-[#0f5f5c]" : ""}`}>
                    {t.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{t.desc}</p>
                  {slug ? (
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-[#0f5f5c]">
                      Learn more <span aria-hidden>&rarr;</span>
                    </span>
                  ) : null}
                </>
              );
              return slug ? (
                <Link
                  key={`${idx}-${t.name}`}
                  href={`/services/chiropractic/${slug}`}
                  className="group flex flex-col rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-[#0f5f5c]/40 hover:shadow-md"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={`${idx}-${t.name}`}
                  className="flex flex-col rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
                >
                  {inner}
                </div>
              );
            })}
          </div>
          {moreTherapies.length > 0 ? (
            <div className="mt-8 border-t border-stone-200 pt-6">
              <h3 className="text-sm font-black uppercase tracking-wide text-[#173f3b]">
                More therapies we offer
              </h3>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {moreTherapies.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className="font-bold text-[#0f5f5c] underline hover:text-[#0f817b]">
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      );
    }
    case "adjustments":
      return <AdjustmentsInActionSection />;
    case "doctors":
      return (
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">{data.doctorsHeading}</h2>
          <p
            className="mt-2 max-w-2xl text-sm text-stone-600"
            dangerouslySetInnerHTML={{ __html: renderRichText(data.doctorsIntro) }}
          />
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.doctors.map((member) => (
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
      );
    case "locations":
      return (
        <section>
          <div className="bg-white p-6 shadow ring-1 ring-[#0f5f5c]/15">
            <h3 className="text-base font-black uppercase tracking-wide text-[#173f3b]">{CHIRO.mainOfficeTitle}</h3>
            <p className="mt-3 leading-relaxed text-stone-700">
              {data.paris.streetAddress} — {data.paris.addressLocality}, {data.paris.addressRegion}. Chiropractic:{" "}
              <a className="font-bold text-[#0f5f5c] underline" href={telHref(data.paris.phonePrimary)}>
                {data.paris.phonePrimary}
              </a>
              .
            </p>
            <Link href={`/locations/${data.paris.slug}`} className="focus-ring mt-4 inline-block text-sm font-bold text-[#0f5f5c] underline">
              Paris details &amp; hours
            </Link>
          </div>
        </section>
      );
    case "wellness_teaser":
      return (
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#173f3b]">{data.wellnessHeading}</h2>
          <p className="mt-3 max-w-3xl text-stone-700">{data.wellnessBody}</p>
          <Link
            href={WELLNESS_CARE_PLANS_PATH}
            className="focus-ring mt-4 inline-flex bg-[#0f5f5c] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
          >
            View wellness care plans
          </Link>
        </section>
      );
    case "awards":
      return (
        <p className="rounded border border-[#d8c061] bg-[#fff7d7] p-5 text-center text-sm text-[#5a4a15]">
          <strong>Awards: </strong>
          {CHIRO.awards}
        </p>
      );
    case "testimonials":
      return data.testimonials.length > 0 ? (
        <section className="bg-[#f8f8f6] px-4 py-12 sm:px-8">
          <h2 className="text-center text-2xl font-black text-[#173f3b]">{data.testimonialsHeading}</h2>
          <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-3">
            {data.testimonials.map((t, idx) => (
              <blockquote
                key={`testimonial-${idx}-${(t.label ?? "").slice(0, 24)}`}
                className="flex flex-col border-b-4 border-[#0f5f5c] bg-white p-6 shadow-sm"
              >
                <p className="font-serif text-5xl leading-none text-[#0f5f5c]" aria-hidden>
                  &ldquo;
                </p>
                <p className="mt-2 flex-1 text-stone-700" dangerouslySetInnerHTML={{ __html: renderRichText(t.quote ?? "") }} />
                {t.label ? (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-500">{t.label}</p>
                ) : null}
              </blockquote>
            ))}
          </div>
        </section>
      ) : null;
    case "cta":
      return (
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">{data.ctaHeading}</h2>
          <p className="mt-3 max-w-3xl text-stone-700">{data.ctaSubtext}</p>
          <div className="mt-6 flex min-h-[56px] flex-col flex-wrap gap-3 sm:flex-row">
            <BookingCta
              label="Book chiropractic"
              query="service=chiropractic&location=paris"
              variant="teal"
              className="focus-ring flex min-h-[56px] flex-1 items-center justify-center rounded-lg bg-[#0f5f5c] px-4 py-3 text-center text-base font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
            />
            <a
              href={telHref(data.paris.phonePrimary)}
              className="focus-ring flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-[#0f5f5c] px-4 py-3 text-center text-base font-black text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
            >
              <span>{data.ctaParisLabel || "Call Paris Office"}</span>
              <span className="text-sm font-bold">{data.paris.phonePrimary}</span>
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-sm text-stone-600">
            <Link href="/patient-forms" className="font-semibold text-[#0f5f5c] underline hover:text-[#0f817b]">
              {data.ctaFormsLink || "Patient forms"}
            </Link>
            <BookingCta
              label={data.stretchLink || "Stretch & Flex Rehab"}
              query="service=stretch"
              className="font-semibold text-[#0f5f5c] underline hover:text-[#0f817b]"
            />
          </div>
        </section>
      );
    case "schedule_cta":
      return (
        <ScheduleCtaCard
          title={data.scheduleCtaTitle || "Questions before you book?"}
          body={
            data.scheduleCtaBody ||
            "Our front desk can verify insurance for chiropractic visits at our Paris office."
          }
          query="service=chiropractic&location=paris"
          secondary={{
            label: data.scheduleCtaSecondary || `Call Paris ${data.paris.phonePrimary}`,
            href: telHref(data.paris.phonePrimary),
          }}
        />
      );
    default:
      return null;
  }
}
