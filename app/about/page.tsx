import { buildPageMetadata } from "@/lib/page-metadata";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { JsonLd } from "@/components/JsonLd";
import { ChiropracticDoctorCard } from "@/components/ChiropracticDoctorCard";
import { getContentMany, renderRichText } from "@/lib/cms";
import { DOCTOR_CMS_KEYS, getDoctorsForMarketing } from "@/lib/cms-doctors";
import { CHIRO } from "@/lib/home-verbatim";
import { IMAGES } from "@/lib/home-images";
import { organizationJsonLd } from "@/lib/structured-data";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "About Us — Family-owned wellness in Northeast Texas",
  description:
    "Since 1998, Chiropractic Associates and The Rub Club have delivered family-owned chiropractic care and licensed massage therapy in Paris and Sulphur Springs, TX.",
  path: "/about",
  ogTitle: "About — Chiropractic Associates",
  ogDescription:
    "Family-owned wellness in Paris and Sulphur Springs, TX. Best Chiropractic Center and Best Massage in The Paris News reader polls.",
});

export default async function AboutPage() {
  const c = await getContentMany(["about_heading", "about_body", ...DOCTOR_CMS_KEYS]);
  const doctors = await getDoctorsForMarketing(c);
  const bodyParagraphs = (c.about_body ?? "").split(/\n\n+/).filter(Boolean);

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "About", url: "/about" }]} />
      <PageHero
        eyebrow="Family-owned since 1998"
        title={c.about_heading}
        lede="Chiropractic Associates leads our family-owned care in Paris and Sulphur Springs, with licensed massage therapy at The Rub Club in Paris."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        <section className="grid gap-10 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-2">
          <div className="space-y-4 leading-relaxed text-stone-700">
            <h2 className="text-2xl font-black text-[#173f3b]">Two practices, one address</h2>
            {bodyParagraphs.map((p, idx) => (
              <p
                key={`about-${idx}`}
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
          <h2 className="text-2xl font-black text-[#173f3b]">Our Paris chiropractors</h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Dr. Greg Thompson, Dr. Sean Welborn, and Dr. Brandy Collins practice in Paris.{" "}
            <Link href="/locations/paris/staff" className="font-bold text-[#0f5f5c] underline">
              Meet our Paris office team
            </Link>
            .{" "}
            <Link href="/sulphur-springs/staff" className="font-bold text-[#0f5f5c] underline">
              Dr. Conner Collins
            </Link>{" "}
            serves patients at our Sulphur Springs office.
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

        <ScheduleCtaCard
          title="Ready to visit?"
          body="Book chiropractic or massage online, or call either office and we will help you find a time."
          bookLabel="Book chiropractic"
          query="service=chiropractic"
          secondary={{ label: "Contact us", href: "/contact" }}
        />
      </div>
    </>
  );
}
