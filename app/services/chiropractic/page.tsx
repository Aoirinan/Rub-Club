import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { getContentMany, parseConditionsList } from "@/lib/cms";
import { DOCTOR_CMS_KEYS, getDoctorsForMarketing } from "@/lib/cms-doctors";
import { getSiteOwnerConfig } from "@/lib/site-owner-config";
import {
  getPublicBookingConfig,
  isPublicBookingEnabled,
  scheduleMetaPhrase,
} from "@/lib/public-booking-settings";
import { serviceBreadcrumbs } from "@/lib/service-breadcrumbs";
import { chiropractorJsonLd, serviceJsonLd } from "@/lib/structured-data";
import { siteUrl } from "@/lib/site-content";
import { pageKeywords } from "@/lib/seo-keywords";
import { getDisplayLocations, getScopeVisualLayout } from "@/lib/cms-display";
import { getPageBlockOrder } from "@/lib/page-layout-db";
import { ServicePageVisualSection } from "@/components/ServicePageVisualSection";
import { parseChiroTreatments } from "@/lib/chiro-treatments";
import { ChiroPageBlock } from "./ChiroPageBlocks";

const CHIRO_CMS_IDS = [
  "chiro_hero_heading",
  "chiro_hero_subheading",
  "chiro_choose_title",
  "chiro_intro_body",
  "chiro_conditions_list",
  "chiro_doctors_heading",
  "chiro_doctors_intro",
  "chiro_treatments_heading",
  "chiro_treatments_intro",
  "chiro_treatments_list",
  "chiro_testimonials_heading",
  "chiro_cta_heading",
  "chiro_cta_subtext",
  "chiro_cta_paris_label",
  "chiro_cta_forms_link",
  "chiro_cta_stretch_link",
  "chiro_schedule_cta_title",
  "chiro_schedule_cta_body",
  "chiro_schedule_cta_secondary",
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
  return buildPageMetadata({
    title: "Chiropractor in Paris, TX — Chiropractic Associates",
    brandInTitle: true,
    description: `Chiropractic adjustments, spinal decompression, rehab, and acupuncture in Paris, TX. ${phrase} — family-owned since 1998.`,
    path: "/services/chiropractic",
    keywords: pageKeywords(["Paris TX chiropractor", "chiropractic Paris Texas"]),
    ogTitle: "Chiropractor in Paris, TX",
    ogDescription: `Adjustments, decompression, rehab, and acupuncture at Chiropractic Associates in Paris. ${phrase}.`,
  });
}

export const revalidate = 60;

export default async function ChiropracticServicePage() {
  const booking = await getPublicBookingConfig();
  const c = await getContentMany([...CHIRO_CMS_IDS, ...DOCTOR_CMS_KEYS]);
  const [doctors, blockOrder, visual] = await Promise.all([
    (async () => {
      let doctorMedia: Awaited<ReturnType<typeof getSiteOwnerConfig>>["doctorMedia"] = [];
      try {
        doctorMedia = (await getSiteOwnerConfig()).doctorMedia;
      } catch {
        doctorMedia = [];
      }
      return getDoctorsForMarketing(c, doctorMedia);
    })(),
    getPageBlockOrder("chiropractic"),
    getScopeVisualLayout("chiropractic"),
  ]);
  const paris = (await getDisplayLocations()).paris;
  const blockData = {
    chooseTitle: c.chiro_choose_title ?? "",
    introParagraphs: (c.chiro_intro_body ?? "").split(/\n\n+/).filter(Boolean),
    conditions: parseConditionsList(c.chiro_conditions_list ?? ""),
    doctors,
    doctorsHeading: c.chiro_doctors_heading ?? "",
    doctorsIntro: c.chiro_doctors_intro ?? "",
    treatmentsHeading: c.chiro_treatments_heading ?? "",
    treatmentsIntro: c.chiro_treatments_intro ?? "",
    treatments: parseChiroTreatments(c.chiro_treatments_list ?? ""),
    testimonialsHeading: c.chiro_testimonials_heading ?? "",
    paris,
    wellnessHeading: c.chiro_wellness_teaser_heading ?? "",
    wellnessBody: c.chiro_wellness_teaser_body ?? "",
    ctaHeading: c.chiro_cta_heading ?? "",
    ctaSubtext: c.chiro_cta_subtext ?? "",
    ctaParisLabel: c.chiro_cta_paris_label ?? "",
    ctaFormsLink: c.chiro_cta_forms_link ?? "",
    stretchLink: c.chiro_cta_stretch_link ?? "",
    scheduleCtaTitle: c.chiro_schedule_cta_title ?? "",
    scheduleCtaBody: c.chiro_schedule_cta_body ?? "",
    scheduleCtaSecondary: c.chiro_schedule_cta_secondary ?? "",
    testimonials: [
      { quote: c.chiro_testimonial_1_text ?? "", label: c.chiro_testimonial_1_attr ?? "" },
      { quote: c.chiro_testimonial_2_text ?? "", label: c.chiro_testimonial_2_attr ?? "" },
      { quote: c.chiro_testimonial_3_text ?? "", label: c.chiro_testimonial_3_attr ?? "" },
    ].filter((t) => t.quote.trim().length > 0),
    booking,
  };

  return (
    <>
      <JsonLd
        data={[
          chiropractorJsonLd(paris),
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
      <Breadcrumbs items={serviceBreadcrumbs({ name: "Chiropractic", url: "/services/chiropractic" })} />
      <PageHero
        eyebrow="Chiropractic Associates · Paris, TX"
        title={c.chiro_hero_heading}
        lede={c.chiro_hero_subheading}
      />
      {visual ? (
        <ServicePageVisualSection
          pageId="chiropractic"
          visual={visual}
          cms={c as Record<string, string>}
          renderBlock={(id) => <ChiroPageBlock id={id} data={blockData} />}
        />
      ) : (
        <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
          {blockOrder.map((id) => (
            <ChiroPageBlock key={id} id={id} data={blockData} />
          ))}
        </div>
      )}
    </>
  );
}
