import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { AdjustmentsInActionSection } from "@/components/AdjustmentsInActionSection";
import { ChiropracticDoctorCard } from "@/components/ChiropracticDoctorCard";
import { IMAGES } from "@/lib/home-images";
import { CHIRO, DOCTORS } from "@/lib/home-verbatim";
import { LOCATIONS, WELLNESS_CARE_PLANS_PATH, telHref } from "@/lib/constants";
import { chiropractorJsonLd, serviceJsonLd } from "@/lib/structured-data";
import { siteUrl } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Chiropractor in Paris & Sulphur Springs, TX — Chiropractic Associates",
  description:
    "Chiropractic adjustments, spinal decompression, rehab, and acupuncture in Paris and Sulphur Springs, TX. Family-owned since 1998. Call to schedule; massage and stretch book online.",
  alternates: { canonical: "/services/chiropractic" },
  openGraph: {
    title: "Chiropractor in Paris & Sulphur Springs, TX",
    description:
      "Adjustments, decompression, rehab, and acupuncture at Chiropractic Associates.",
    url: "/services/chiropractic",
  },
};

const CHIRO_TESTIMONIALS = [
  {
    quote:
      "After a car accident I could barely turn my head. A few weeks with Dr. Welborn plus deep-tissue work from The Rub Club and I was back to normal.",
    label: "Sulphur Springs patient · Auto injury recovery",
  },
  {
    quote:
      "Dr. Thompson and the team have kept me moving for years. I always leave feeling looked after — and they never push extra visits I do not need.",
    label: "Long-time Paris patient · Chiropractic",
  },
  {
    quote:
      "I had sciatica so bad I couldn't sit through a workday. Dr. Collins found the problem fast and had me feeling better within two weeks.",
    label: "Paris patient · Sciatica",
  },
] as const;

const TREATMENT_CARDS = [
  {
    name: "Chiropractic Adjustments",
    desc: "Hands-on spinal and joint manipulation to restore alignment and reduce pain.",
    icon: (
      <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
        <path
          d="M24 4v6M18 12h12M16 20h16M14 28h20M12 36h24M10 44h28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="24" cy="10" r="3" fill="currentColor" />
        <circle cx="24" cy="22" r="3" fill="currentColor" />
        <circle cx="24" cy="34" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "Electric Muscle Stimulation",
    desc: "Low-level electrical pulses that ease muscle spasms and speed tissue recovery.",
    icon: (
      <svg viewBox="0 0 48 48" className="h-12 w-12" fill="currentColor" aria-hidden>
        <path d="M28 4L12 26h10l-2 18 18-28H26l2-12z" />
      </svg>
    ),
  },
  {
    name: "Moist Heat & Cryotherapy",
    desc: "Targeted heat and cold application to reduce inflammation and improve circulation.",
    icon: (
      <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
        <path
          d="M24 6c-4 6-8 10-8 18a8 8 0 0016 0c0-8-4-12-8-18z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M10 38h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <path d="M14 42h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      </svg>
    ),
  },
  {
    name: "Spinal Decompression",
    desc: "Gentle traction therapy to relieve pressure on compressed discs and nerves.",
    icon: (
      <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
        <path d="M8 14h32M8 24h32M8 34h32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M24 8v6M24 34v6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="3 4"
        />
      </svg>
    ),
  },
  {
    name: "Therapeutic Massage",
    desc: "Soft-tissue work including trigger point therapy and lymphatic massage.",
    icon: (
      <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
        <path
          d="M14 30c4-6 8-8 12-8s8 2 12 8M10 22c3-5 7-7 14-7s11 2 14 7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <ellipse cx="24" cy="36" rx="10" ry="5" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    name: "Acupuncture",
    desc: "Fine-needle therapy for muscle and joint complaints — offered by Dr. Welborn.",
    icon: (
      <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
        <line x1="24" y1="6" x2="24" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 38l4 6 4-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Pediatric Care",
    desc: "Gentle, age-appropriate adjustments for infants through teenagers.",
    icon: (
      <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
        <circle cx="24" cy="14" r="7" stroke="currentColor" strokeWidth="2.5" />
        <path
          d="M12 40c2-10 8-14 12-14s10 4 12 14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const;

export default function ChiropracticServicePage() {
  return (
    <>
      <JsonLd
        data={[
          chiropractorJsonLd(LOCATIONS.paris),
          chiropractorJsonLd(LOCATIONS.sulphur_springs),
          serviceJsonLd({
            name: "Chiropractic Care",
            description:
              "Adjustments, spinal decompression, rehab exercises, electric stim, and acupuncture for back, neck, sciatica, and auto injuries.",
            url: siteUrl("/services/chiropractic"),
            serviceType: "Chiropractic",
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Services", url: "/services/chiropractic" },
          { name: "Chiropractic", url: "/services/chiropractic" },
        ]}
      />

      <PageHero
        eyebrow="Chiropractic Associates · Family-owned since 1998"
        title="Efficient, evidence-informed chiropractic care"
        lede="Dr. Greg Thompson, Dr. Sean Welborn, and Dr. Brandy Collins serve patients across Northeast Texas from Paris and Sulphur Springs."
      />

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        <section className="grid gap-10 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#173f3b]">{CHIRO.chooseTitle}</h2>
            <p className="leading-relaxed text-stone-700">{CHIRO.chooseLead}</p>
            <p className="leading-relaxed text-stone-700">{CHIRO.chooseP2}</p>
            <p className="leading-relaxed text-stone-700">{CHIRO.chooseP3}</p>
            <ul className="list-disc space-y-2 pl-6 text-stone-700">
              {CHIRO.conditions.map((c) => (
                <li key={c}>{c}</li>
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
            {TREATMENT_CARDS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="text-[#0f5f5c]">{t.icon}</div>
                <h3 className="mt-3 text-base font-black text-[#173f3b]">{t.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <AdjustmentsInActionSection />

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Our chiropractors</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {DOCTORS.map((member) => (
              <ChiropracticDoctorCard
                key={member.name}
                name={member.name}
                role={member.role}
                bio={member.bio}
                imageSrc={IMAGES[member.imageKey]}
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
            <p className="mt-3 leading-relaxed text-stone-700">{CHIRO.mainOfficeBody}</p>
            <Link
              href="/locations/paris"
              className="focus-ring mt-4 inline-block text-sm font-bold text-[#0f5f5c] underline"
            >
              Paris details &amp; hours
            </Link>
          </div>
          <div className="bg-white p-6 shadow ring-1 ring-[#0f5f5c]/15">
            <h3 className="text-base font-black uppercase tracking-wide text-[#173f3b]">
              {CHIRO.secondLocationTitle}
            </h3>
            <p className="mt-3 leading-relaxed text-stone-700">{CHIRO.secondLocationBody}</p>
            <Link
              href="/locations/sulphur-springs"
              className="focus-ring mt-4 inline-block text-sm font-bold text-[#0f5f5c] underline"
            >
              Sulphur Springs details &amp; hours
            </Link>
          </div>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#173f3b]">Wellness care plans</h2>
          <p className="mt-3 max-w-3xl text-stone-700">
            Monthly Chiro-Fitness and Acu-Fit memberships at our Paris office combine adjustments,
            roller table, massage, therapy, acupuncture, and rehab options — billed on automatic debit
            for ongoing wellness care.
          </p>
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

        <section className="bg-[#f8f8f6] px-4 py-12 sm:px-8">
          <h2 className="text-center text-2xl font-black text-[#173f3b]">What Our Chiropractic Patients Say</h2>
          <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-3">
            {CHIRO_TESTIMONIALS.map((t) => (
              <blockquote
                key={t.label}
                className="flex flex-col border-b-4 border-[#0f5f5c] bg-white p-6 shadow-sm"
              >
                <p className="font-serif text-5xl leading-none text-[#0f5f5c]" aria-hidden>
                  &ldquo;
                </p>
                <p className="mt-2 flex-1 text-stone-700">{t.quote}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-500">{t.label}</p>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Ready for Relief?</h2>
          <p className="mt-3 max-w-3xl text-stone-700">
            Chiropractic appointments are booked by phone. Call either office and we will fit you in —
            same-day appointments are often available.
          </p>
          <div className="mt-6 flex min-h-[56px] flex-col gap-3 sm:flex-row">
            <a
              href={telHref("903-785-5551")}
              className="focus-ring flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg bg-[#0f5f5c] px-4 py-3 text-center text-base font-black text-white hover:bg-[#0f817b]"
            >
              <span>Call Paris Office</span>
              <span className="text-sm font-bold text-white/90">903-785-5551</span>
            </a>
            <a
              href={telHref("903-919-5020")}
              className="focus-ring flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg bg-[#0f5f5c] px-4 py-3 text-center text-base font-black text-white hover:bg-[#0f817b]"
            >
              <span>Call Sulphur Springs</span>
              <span className="text-sm font-bold text-white/90">903-919-5020</span>
            </a>
          </div>
          <p className="mt-6 text-center text-sm text-stone-600">
            <Link href="/book" className="font-semibold text-[#0f5f5c] underline hover:text-[#0f817b]">
              Massage or stretch appointments? → Book online
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
