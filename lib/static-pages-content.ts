import { getContentMany } from "@/lib/cms";
import { STATIC_PAGES_CMS_IDS } from "@/lib/static-pages-cms";
import type { Testimonial } from "@/lib/testimonials";
import { TESTIMONIALS } from "@/lib/testimonials";

export type ReviewsPageContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  ctaHeading: string;
  ctaBody: string;
  testimonials: Testimonial[];
};

export async function getReviewsPageContent(): Promise<ReviewsPageContent> {
  const cms = await getContentMany([...STATIC_PAGES_CMS_IDS]);

  const testimonials = TESTIMONIALS.map((t, i) => {
    const n = i + 1;
    const quote = cms[`reviews_testimonial_${n}_quote`]?.trim();
    const author = cms[`reviews_testimonial_${n}_author`]?.trim();
    const context = cms[`reviews_testimonial_${n}_context`]?.trim();
    return {
      quote: quote || t.quote,
      author: author || t.author,
      context: context || t.context,
      service: t.service,
      fromGoogleReview: t.fromGoogleReview,
    };
  }).filter((t) => t.quote.length > 0);

  return {
    heroEyebrow: cms.reviews_hero_eyebrow?.trim() || "Patient stories",
    heroTitle: cms.reviews_hero_title?.trim() || "What our patients say",
    heroLede:
      cms.reviews_hero_lede?.trim() ||
      "Voted Best Chiropractic Center and Best Massage in The Paris News reader polls. Below are stories adapted from public Google reviews (paraphrased, not copied word-for-word).",
    ctaHeading: cms.reviews_cta_heading?.trim() || "Loved your visit? Leave us a review.",
    ctaBody:
      cms.reviews_cta_body?.trim() ||
      "A few words on Google help other families find dependable, family-owned care in Northeast Texas. Each button opens your Google review link when configured in admin, otherwise Google Maps for that office.",
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

export async function getInsurancePageContent(): Promise<InsurancePageContent> {
  const cms = await getContentMany([...INSURANCE_IDS]);
  return {
    heroTitle: cms.insurance_hero_title?.trim() || "Plain-language insurance answers",
    heroLede:
      cms.insurance_hero_lede?.trim() ||
      "We work with most major medical plans for chiropractic care and file claims on your behalf. Massage therapy is generally self-pay.",
    chiroHeading: cms.insurance_chiro_heading?.trim() || "Chiropractic coverage",
    chiroBody: cms.insurance_chiro_body?.trim() || "",
    massageHeading: cms.insurance_massage_heading?.trim() || "Massage therapy",
    massageBody: cms.insurance_massage_body?.trim() || "",
    verifyHeading: cms.insurance_verify_heading?.trim() || "Verify before your visit",
    verifyBody: cms.insurance_verify_body?.trim() || "",
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
      "Adjustments, decompression, rehab, acupuncture, and pediatric care at our Paris and Sulphur Springs offices.",
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

export async function getPatientFormsContent(): Promise<PatientFormsContent> {
  const cms = await getContentMany([...PATIENT_FORMS_IDS]);
  return {
    heroEyebrow: cms.patient_forms_hero_eyebrow?.trim() || "Welcome to our practice",
    heroTitle: cms.patient_forms_hero_title?.trim() || "Patient forms",
    heroLede:
      cms.patient_forms_hero_lede?.trim() ||
      "Download our 9-page chiropractic intake packet or the massage new-client PDF, print and complete it at home, and bring it to your visit in Paris or Sulphur Springs.",
    chiroHeading:
      cms.patient_forms_chiro_heading?.trim() || "Chiropractic: new patient & personal injury",
    chiroIntro: cms.patient_forms_chiro_intro?.trim() || "",
    chiroBullets: cms.patient_forms_chiro_bullets?.trim() || "",
    massageHeading: cms.patient_forms_massage_heading?.trim() || "New client form (PDF)",
    massageBody: cms.patient_forms_massage_body?.trim() || "",
    inpersonHeading:
      cms.patient_forms_inperson_heading?.trim() || "Bringing your forms in person",
    inpersonBullets: cms.patient_forms_inperson_bullets?.trim() || "",
  };
}
