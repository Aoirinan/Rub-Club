import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { CHIRO, DOCTORS } from "@/lib/home-verbatim";
import { IMAGES } from "@/lib/home-images";
import { organizationJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "About Us — Family-owned wellness in Northeast Texas",
  description:
    "Since 1998, Chiropractic Associates and The Rub Club have delivered family-owned chiropractic care and licensed massage therapy in Paris and Sulphur Springs, TX.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Chiropractic Associates & The Rub Club",
    description:
      "Family-owned wellness in Paris and Sulphur Springs, TX. Best Chiropractic Center and Best Massage in The Paris News reader polls.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "About", url: "/about" }]} />
      <PageHero
        eyebrow="Family-owned since 1998"
        title="About our practice"
        lede="Two brands, one mission: efficient, respectful, family-owned care for Paris-area families and visitors from across Northeast Texas."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        <section className="grid gap-10 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-2">
          <div className="space-y-4 leading-relaxed text-stone-700">
            <h2 className="text-2xl font-black text-[#173f3b]">Two practices, one address</h2>
            <p>
              Chiropractic Associates was founded in Paris, TX in 1998 by Dr. Greg Thompson. As the
              practice grew, Dr. Thompson opened The Rub Club so that licensed massage therapists
              could coordinate care directly with the chiropractic team — same building, same
              schedule, same standards.
            </p>
            <p>
              Today we serve Northeast Texas and Southeast Oklahoma from our main Paris office and a
              second chiropractic location in Sulphur Springs. Our doctors and therapists share
              charts and timelines so your massage and adjustment work together, not against each
              other.
            </p>
            <p className="rounded border border-[#d8c061] bg-[#fff7d7] p-4 text-[#5a4a15]">
              <strong>Awards: </strong>
              {CHIRO.awards}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden shadow-md">
            <Image
              src={IMAGES.massagePatient}
              alt="A licensed therapist working on a patient at The Rub Club"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
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

        <CtaCard
          title="Ready to start care?"
          body="Book online in under a minute, or call the office and we will help fit you in."
          primary={{ label: "Book online", href: "/book" }}
          secondary={{ label: "Contact us", href: "/contact" }}
        />
      </div>
    </>
  );
}
