import { getContentMany } from "@/lib/cms";
import {
  buildStaticPagesCmsDefaults,
  REVIEWS_TESTIMONIAL_SLOTS,
  STATIC_PAGES_CMS_IDS,
} from "@/lib/static-pages-cms";
import type { Testimonial } from "@/lib/testimonials";

export type ReviewsPageContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  ctaHeading: string;
  ctaBody: string;
  testimonials: Testimonial[];
};

export async function getReviewsPageContent(
  prefix: "" | "ss_" = "",
): Promise<ReviewsPageContent> {
  const cms = await getContentMany(
    STATIC_PAGES_CMS_IDS.filter((id) =>
      prefix ? id.startsWith(`${prefix}reviews_`) : id.startsWith("reviews_") && !id.startsWith("ss_"),
    ),
  );
  const defaults = buildStaticPagesCmsDefaults();

  const testimonials = REVIEWS_TESTIMONIAL_SLOTS.map(({ n, testimonial: t }) => {
    const quote = cms[`${prefix}reviews_testimonial_${n}_quote`]?.trim();
    const author = cms[`${prefix}reviews_testimonial_${n}_author`]?.trim();
    const context = cms[`${prefix}reviews_testimonial_${n}_context`]?.trim();
    return {
      quote: quote || t.quote,
      author: author || t.author,
      context: context || t.context,
      service: t.service,
      fromGoogleReview: t.fromGoogleReview,
    };
  }).filter((t) => t.quote.length > 0);

  return {
    heroEyebrow: cms[`${prefix}reviews_hero_eyebrow`]?.trim() || defaults[`${prefix}reviews_hero_eyebrow`],
    heroTitle: cms[`${prefix}reviews_hero_title`]?.trim() || defaults[`${prefix}reviews_hero_title`],
    heroLede: cms[`${prefix}reviews_hero_lede`]?.trim() || defaults[`${prefix}reviews_hero_lede`],
    ctaHeading: cms[`${prefix}reviews_cta_heading`]?.trim() || defaults[`${prefix}reviews_cta_heading`],
    ctaBody: cms[`${prefix}reviews_cta_body`]?.trim() || defaults[`${prefix}reviews_cta_body`],
    testimonials,
  };
}

export type InsurancePageContent = {
  heroTitle: string;
  heroLede: string;
  chiroHeading: string;
  chiroBody: string;
  massageHeading: string;
  massageBody: string;
  verifyHeading: string;
  verifyBody: string;
};

const INSURANCE_IDS = [
  "insurance_hero_title",
  "insurance_hero_lede",
  "insurance_chiro_heading",
  "insurance_chiro_body",
  "insurance_massage_heading",
  "insurance_massage_body",
  "insurance_verify_heading",
  "insurance_verify_body",
] as const;

export async function getInsurancePageContent(
  prefix: "" | "ss_" = "",
): Promise<InsurancePageContent> {
  const ids = INSURANCE_IDS.map((id) => `${prefix}${id}`);
  const cms = await getContentMany(ids);
  const defaults = buildStaticPagesCmsDefaults();
  const g = (id: (typeof INSURANCE_IDS)[number]) =>
    cms[`${prefix}${id}`]?.trim() || defaults[`${prefix}${id}`] || defaults[id] || "";
  return {
    heroTitle: g("insurance_hero_title") || "Plain-language insurance answers",
    heroLede: g("insurance_hero_lede"),
    chiroHeading: g("insurance_chiro_heading") || "Chiropractic coverage",
    chiroBody: g("insurance_chiro_body"),
    massageHeading: g("insurance_massage_heading") || "Massage therapy",
    massageBody: g("insurance_massage_body"),
    verifyHeading: g("insurance_verify_heading") || "Verify before your visit",
    verifyBody: g("insurance_verify_body"),
  };
}

export type ServicesHubContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  chiroTitle: string;
  chiroBody: string;
  massageTitle: string;
  massageBody: string;
};

const SERVICES_HUB_IDS = [
  "services_hero_eyebrow",
  "services_hero_title",
  "services_hero_lede",
  "services_chiro_title",
  "services_chiro_body",
  "services_massage_title",
  "services_massage_body",
] as const;

export async function getServicesHubContent(): Promise<ServicesHubContent> {
  const cms = await getContentMany([...SERVICES_HUB_IDS]);
  return {
    heroEyebrow: cms.services_hero_eyebrow?.trim() || "Chiropractic Associates & The Rub Club",
    heroTitle: cms.services_hero_title?.trim() || "Our services",
    heroLede:
      cms.services_hero_lede?.trim() ||
      "Family-owned chiropractic in Paris and Sulphur Springs, plus licensed massage therapy at our Paris office.",
    chiroTitle: cms.services_chiro_title?.trim() || "Chiropractic care",
    chiroBody:
      cms.services_chiro_body?.trim() ||
      "Adjustments, decompression, rehab, and pediatric care at our Paris and Sulphur Springs offices. Acupuncture is offered at our Paris office only.",
    massageTitle: cms.services_massage_title?.trim() || "Massage therapy — The Rub Club",
    massageBody:
      cms.services_massage_body?.trim() ||
      "Deep tissue, prenatal, sports, and therapeutic massage at our Paris location, coordinated with chiropractic care when helpful.",
  };
}

export type PatientFormsContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  chiroHeading: string;
  chiroIntro: string;
  chiroBullets: string;
  massageHeading: string;
  massageBody: string;
  inpersonHeading: string;
  inpersonBullets: string;
};

const PATIENT_FORMS_IDS = [
  "patient_forms_hero_eyebrow",
  "patient_forms_hero_title",
  "patient_forms_hero_lede",
  "patient_forms_chiro_heading",
  "patient_forms_chiro_intro",
  "patient_forms_chiro_bullets",
  "patient_forms_massage_heading",
  "patient_forms_massage_body",
  "patient_forms_inperson_heading",
  "patient_forms_inperson_bullets",
] as const;

export async function getPatientFormsContent(
  prefix: "" | "ss_" = "",
): Promise<PatientFormsContent> {
  const cms = await getContentMany(PATIENT_FORMS_IDS.map((id) => `${prefix}${id}`));
  const defaults = buildStaticPagesCmsDefaults();
  const g = (id: (typeof PATIENT_FORMS_IDS)[number]) =>
    cms[`${prefix}${id}`]?.trim() || defaults[`${prefix}${id}`] || defaults[id] || "";
  return {
    heroEyebrow: g("patient_forms_hero_eyebrow"),
    heroTitle: g("patient_forms_hero_title"),
    heroLede: g("patient_forms_hero_lede"),
    chiroHeading: g("patient_forms_chiro_heading"),
    chiroIntro: g("patient_forms_chiro_intro"),
    chiroBullets: g("patient_forms_chiro_bullets"),
    massageHeading: g("patient_forms_massage_heading"),
    massageBody: g("patient_forms_massage_body"),
    inpersonHeading: g("patient_forms_inperson_heading"),
    inpersonBullets: g("patient_forms_inperson_bullets"),
  };
}
