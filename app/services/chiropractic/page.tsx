import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { IMAGES } from "@/lib/home-images";
import { CHIRO, DOCTORS } from "@/lib/home-verbatim";
import { LOCATIONS, WELLNESS_CARE_PLANS_PATH, telHref } from "@/lib/constants";
import { chiropractorJsonLd, serviceJsonLd } from "@/lib/structured-data";
import { siteUrl } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Chiropractor in Paris & Sulphur Springs, TX — Chiropractic Associates",
  description:
    "Chiropractic adjustments, spinal decompression, rehab, and acupuncture in Paris and Sulphur Springs, TX. Family-owned since 1998. Book online or call.",
  alternates: { canonical: "/services/chiropractic" },
  openGraph: {
    title: "Chiropractor in Paris & Sulphur Springs, TX",
    description:
      "Adjustments, decompression, rehab, and acupuncture at Chiropractic Associates.",
    url: "/services/chiropractic",
  },
};

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
          <h2 className="text-2xl font-black text-[#173f3b]">Treatments we combine</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-stone-700">{CHIRO.treatmentsIntro}</p>
          <ul className="mt-4 grid list-disc gap-2 pl-6 text-stone-700 sm:grid-cols-2">
            {CHIRO.treatments.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Our chiropractors</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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

        <CtaCard
          title="Ready for relief?"
          body="Book a chiropractic appointment online, or call the office and we will fit you in."
          primary={{ label: "Book chiropractic online", href: "/book?service=chiropractic" }}
          secondary={{ label: "Call Paris 903-785-5551", href: telHref("903-785-5551") }}
        />
      </div>
    </>
  );
}
