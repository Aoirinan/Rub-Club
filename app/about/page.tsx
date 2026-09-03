import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPageMeta } from "@/lib/page-meta";
import {
  joinNames,
  pageOgDescriptionId,
  pageOgTitleId,
  parisText,
} from "@/lib/paris-pages-cms";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { JsonLd } from "@/components/JsonLd";
import { ChiropracticDoctorCard } from "@/components/ChiropracticDoctorCard";
import { getContentMany, renderRichText } from "@/lib/cms";
import { DOCTOR_CMS_KEYS, getDoctorsForMarketing } from "@/lib/cms-doctors";
import { getSiteOwnerConfig } from "@/lib/site-owner-config";
import { getSitePhotos } from "@/lib/site-photos-server";
import { organizationJsonLd } from "@/lib/structured-data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [meta, og] = await Promise.all([
    getPageMeta("about", {
      title: "About Us — Family-owned wellness in Northeast Texas",
      description:
        "Since 1998, Chiropractic Associates and The Rub Club have delivered family-owned chiropractic care and licensed massage therapy in Paris and Sulphur Springs, TX.",
    }),
    getContentMany([pageOgTitleId("about"), pageOgDescriptionId("about")]),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/about",
    ogTitle: parisText(og, pageOgTitleId("about")),
    ogDescription: parisText(og, pageOgDescriptionId("about")),
  });
}

const ABOUT_COPY_IDS = [
  "about_hero_eyebrow",
  "about_hero_lede",
  "about_story_heading",
  "about_awards_label",
  "about_awards_text",
  "about_photo_alt",
  "about_doctors_heading",
  "about_doctors_intro",
  "about_doctors_link_label",
  "about_cta_title",
  "about_cta_body",
  "about_cta_book_label",
  "about_cta_secondary_label",
] as const;

export default async function AboutPage() {
  const c = await getContentMany(["about_heading", "about_body", ...ABOUT_COPY_IDS, ...DOCTOR_CMS_KEYS]);
  let doctorMedia: Awaited<ReturnType<typeof getSiteOwnerConfig>>["doctorMedia"] = [];
  try {
    doctorMedia = (await getSiteOwnerConfig()).doctorMedia;
  } catch {
    doctorMedia = [];
  }
  const doctors = await getDoctorsForMarketing(c, doctorMedia);
  const photos = await getSitePhotos();
  const bodyParagraphs = (c.about_body ?? "").split(/\n\n+/).filter(Boolean);
  const t = (id: string) => parisText(c, id);
  const doctorsIntro = t("about_doctors_intro").replace(
    "{doctors}",
    joinNames(doctors.map((d) => d.name)),
  );

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "About", url: "/about" }]} />
      <PageHero
        eyebrow={t("about_hero_eyebrow")}
        title={c.about_heading}
        lede={t("about_hero_lede")}
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        <section className="grid gap-10 border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-2">
          <div className="space-y-4 leading-relaxed text-stone-700">
            <h2 className="text-2xl font-black text-[#4a1515]">{t("about_story_heading")}</h2>
            {bodyParagraphs.map((p, idx) => (
              <p
                key={`about-${idx}`}
                dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
              />
            ))}
            <p className="rounded border border-[#d8c061] bg-[#fff7d7] p-4 text-[#5a4a15]">
              <strong>{t("about_awards_label")}</strong>
              {t("about_awards_text")}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden shadow-lg lg:aspect-auto lg:min-h-[360px]">
            <Image
              src={photos.chiroBlade}
              alt={t("about_photo_alt")}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </section>

        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#4a1515]">{t("about_doctors_heading")}</h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            {doctorsIntro}{" "}
            <Link href="/locations/paris/staff" className="font-bold text-[#c0392b] underline">
              {t("about_doctors_link_label")}
            </Link>
            .
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
                actionVideos={member.actionVideos}
              />
            ))}
          </div>
        </section>

        <ScheduleCtaCard
          title={t("about_cta_title")}
          body={t("about_cta_body")}
          bookLabel={t("about_cta_book_label")}
          query="service=chiropractic"
          secondary={{ label: t("about_cta_secondary_label"), href: "/contact" }}
        />
      </div>
    </>
  );
}
