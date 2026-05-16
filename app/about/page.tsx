import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { ChiropracticDoctorCard } from "@/components/ChiropracticDoctorCard";
import { getContentMany, renderRichText } from "@/lib/cms";
import { getDoctorsForMarketing } from "@/lib/cms-doctors";
import { CHIRO } from "@/lib/home-verbatim";
import { IMAGES } from "@/lib/home-images";
import { organizationJsonLd } from "@/lib/structured-data";
import { publicBookingHref } from "@/lib/public-booking";

export const revalidate = 60;

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

export default async function AboutPage() {
  const c = await getContentMany(["about_heading", "about_body"]);
  const doctors = await getDoctorsForMarketing();
  const bodyParagraphs = (c.about_body ?? "").split(/\n\n+/).filter(Boolean);

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "About", url: "/about" }]} />
      <PageHero
        eyebrow="Family-owned since 1998"
        title={c.about_heading}
        lede="Two brands, one mission: efficient, respectful, family-owned care for Paris-area families and visitors from across Northeast Texas."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        <section className="grid gap-10 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-2">
          <div className="space-y-4 leading-relaxed text-stone-700">
            <h2 className="text-2xl font-black text-[#173f3b]">Two practices, one address</h2>
            {bodyParagraphs.map((p) => (
              <p
                key={p.slice(0, 40)}
                dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
              />
            ))}
            <p className="rounded border border-[#d8c061] bg-[#fff7d7] p-4 text-[#5a4a15]">
              <strong>Awards: </strong>
              {CHIRO.awards}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden shadow-lg lg:aspect-auto lg:min-h-[360px]">
            <Image
              src={IMAGES.chiroBlade}
              alt="Chiropractic Associates team at the Paris office"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Our chiropractors</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((member) => (
              <ChiropracticDoctorCard
                key={member.name}
                name={member.name}
                role={member.role}
                bio={member.bio}
                imageSrc={member.imageSrc}
                videoUrl={member.videoUrl}
              />
            ))}
          </div>
        </section>

        <CtaCard
          title="Ready to visit?"
          body="Book massage online or call either office for chiropractic appointments."
          primary={{ label: "Book online", href: publicBookingHref() }}
          secondary={{ label: "Contact us", href: "/contact" }}
        />
      </div>
    </>
  );
}
