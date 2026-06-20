import type { ContentFieldMeta } from "@/lib/cms-registry";
import { TESTIMONIALS } from "@/lib/testimonials";

export const STATIC_PAGES_CMS_REGISTRY: ContentFieldMeta[] = [
  {
    id: "insurance_hero_title",
    pageLabel: "Insurance",
    sectionLabel: "Hero",
    fieldLabel: "Page title",
    type: "text",
  },
  {
    id: "insurance_hero_lede",
    pageLabel: "Insurance",
    sectionLabel: "Hero",
    fieldLabel: "Intro paragraph",
    type: "text",
  },
  {
    id: "insurance_chiro_heading",
    pageLabel: "Insurance",
    sectionLabel: "Chiropractic",
    fieldLabel: "Section heading",
    type: "text",
  },
  {
    id: "insurance_chiro_body",
    pageLabel: "Insurance",
    sectionLabel: "Chiropractic",
    fieldLabel: "Body + bullet list (one bullet per line starting with - )",
    type: "richtext",
  },
  {
    id: "insurance_massage_heading",
    pageLabel: "Insurance",
    sectionLabel: "Massage",
    fieldLabel: "Section heading",
    type: "text",
  },
  {
    id: "insurance_massage_body",
    pageLabel: "Insurance",
    sectionLabel: "Massage",
    fieldLabel: "Body paragraph",
    type: "richtext",
  },
  {
    id: "insurance_verify_heading",
    pageLabel: "Insurance",
    sectionLabel: "Verify",
    fieldLabel: "Section heading",
    type: "text",
  },
  {
    id: "insurance_verify_body",
    pageLabel: "Insurance",
    sectionLabel: "Verify",
    fieldLabel: "Body paragraph",
    type: "richtext",
  },

  {
    id: "services_hero_eyebrow",
    pageLabel: "Services hub",
    sectionLabel: "Hero",
    fieldLabel: "Eyebrow",
    type: "text",
  },
  {
    id: "services_hero_title",
    pageLabel: "Services hub",
    sectionLabel: "Hero",
    fieldLabel: "Page title",
    type: "text",
  },
  {
    id: "services_hero_lede",
    pageLabel: "Services hub",
    sectionLabel: "Hero",
    fieldLabel: "Intro paragraph",
    type: "text",
  },
  {
    id: "services_chiro_title",
    pageLabel: "Services hub",
    sectionLabel: "Chiropractic card",
    fieldLabel: "Card title",
    type: "text",
  },
  {
    id: "services_chiro_body",
    pageLabel: "Services hub",
    sectionLabel: "Chiropractic card",
    fieldLabel: "Card description",
    type: "richtext",
  },
  {
    id: "services_massage_title",
    pageLabel: "Services hub",
    sectionLabel: "Massage card",
    fieldLabel: "Card title",
    type: "text",
  },
  {
    id: "services_massage_body",
    pageLabel: "Services hub",
    sectionLabel: "Massage card",
    fieldLabel: "Card description",
    type: "richtext",
  },

  {
    id: "reviews_hero_eyebrow",
    pageLabel: "Reviews",
    sectionLabel: "Hero",
    fieldLabel: "Eyebrow",
    type: "text",
  },
  {
    id: "reviews_hero_title",
    pageLabel: "Reviews",
    sectionLabel: "Hero",
    fieldLabel: "Page title",
    type: "text",
  },
  {
    id: "reviews_hero_lede",
    pageLabel: "Reviews",
    sectionLabel: "Hero",
    fieldLabel: "Intro paragraph",
    type: "text",
  },
  {
    id: "reviews_cta_heading",
    pageLabel: "Reviews",
    sectionLabel: "Google review CTA",
    fieldLabel: "Heading",
    type: "text",
  },
  {
    id: "reviews_cta_body",
    pageLabel: "Reviews",
    sectionLabel: "Google review CTA",
    fieldLabel: "Body paragraph",
    type: "richtext",
  },
  ...TESTIMONIALS.flatMap((t, i) => {
    const n = i + 1;
    return [
      {
        id: `reviews_testimonial_${n}_quote`,
        pageLabel: "Reviews" as const,
        sectionLabel: `Testimonial ${n}`,
        fieldLabel: "Quote",
        type: "richtext" as const,
      },
      {
        id: `reviews_testimonial_${n}_author`,
        pageLabel: "Reviews" as const,
        sectionLabel: `Testimonial ${n}`,
        fieldLabel: "Author",
        type: "text" as const,
      },
      {
        id: `reviews_testimonial_${n}_context`,
        pageLabel: "Reviews" as const,
        sectionLabel: `Testimonial ${n}`,
        fieldLabel: "Context line (optional)",
        type: "text" as const,
      },
    ];
  }),

  {
    id: "patient_forms_hero_eyebrow",
    pageLabel: "Patient forms",
    sectionLabel: "Hero",
    fieldLabel: "Eyebrow",
    type: "text",
  },
  {
    id: "patient_forms_hero_title",
    pageLabel: "Patient forms",
    sectionLabel: "Hero",
    fieldLabel: "Page title",
    type: "text",
  },
  {
    id: "patient_forms_hero_lede",
    pageLabel: "Patient forms",
    sectionLabel: "Hero",
    fieldLabel: "Intro paragraph",
    type: "text",
  },
  {
    id: "patient_forms_chiro_heading",
    pageLabel: "Patient forms",
    sectionLabel: "Chiropractic PDF",
    fieldLabel: "Section heading",
    type: "text",
  },
  {
    id: "patient_forms_chiro_intro",
    pageLabel: "Patient forms",
    sectionLabel: "Chiropractic PDF",
    fieldLabel: "Intro paragraph",
    type: "richtext",
  },
  {
    id: "patient_forms_chiro_bullets",
    pageLabel: "Patient forms",
    sectionLabel: "Chiropractic PDF",
    fieldLabel: "Bullet list (one per line starting with - )",
    type: "richtext",
  },
  {
    id: "patient_forms_massage_heading",
    pageLabel: "Patient forms",
    sectionLabel: "Massage PDF",
    fieldLabel: "Section heading",
    type: "text",
  },
  {
    id: "patient_forms_massage_body",
    pageLabel: "Patient forms",
    sectionLabel: "Massage PDF",
    fieldLabel: "Body paragraph",
    type: "richtext",
  },
  {
    id: "patient_forms_inperson_heading",
    pageLabel: "Patient forms",
    sectionLabel: "In person",
    fieldLabel: "Section heading",
    type: "text",
  },
  {
    id: "patient_forms_inperson_bullets",
    pageLabel: "Patient forms",
    sectionLabel: "In person",
    fieldLabel: "Bullet list (one per line starting with - )",
    type: "richtext",
  },
];

export function buildStaticPagesCmsDefaults(): Record<string, string> {
  const defaults: Record<string, string> = {
    insurance_hero_title: "Plain-language insurance answers",
    insurance_hero_lede:
      "We work with most major medical plans for chiropractic care and file claims on your behalf. Massage therapy is generally self-pay.",
    insurance_chiro_heading: "Chiropractic coverage",
    insurance_chiro_body: `Most commercial insurance, Medicare, and many auto-injury and worker's comp plans cover chiropractic visits. We will verify your benefits and explain copays, deductibles, and visit limits up front. If your plan does not cover chiropractic, we offer a transparent self-pay rate.

- Bring your insurance card and photo ID to your first visit.
- We bill your plan directly so you don't pay the full amount up front.
- Auto injuries: ask us about med-pay and personal injury protection — we frequently coordinate with attorneys and adjusters.
- Personal injury questions: our Paris case manager and office team can help with paperwork and coordination.`,
    insurance_massage_heading: "Massage therapy",
    insurance_massage_body:
      "Massage therapy is generally a self-pay service. Some HSA/FSA cards may apply with a doctor's note. The massage desk can walk you through pricing for 30- and 60-minute visits.",
    insurance_verify_heading: "Verify before your visit",
    insurance_verify_body:
      "The fastest way to confirm coverage is to call us with your plan details handy. Have your insurance card, group number, and date of birth available.",

    services_hero_eyebrow: "Chiropractic Associates & The Rub Club",
    services_hero_title: "Our services",
    services_hero_lede:
      "Family-owned chiropractic in Paris and Sulphur Springs, plus licensed massage therapy at our Paris office.",
    services_chiro_title: "Chiropractic care",
    services_chiro_body:
      "Adjustments, decompression, rehab, and pediatric care at our Paris and Sulphur Springs offices. Acupuncture is offered at our Paris office only.",
    services_massage_title: "Massage therapy — The Rub Club",
    services_massage_body:
      "Deep tissue, prenatal, sports, and therapeutic massage at our Paris location, coordinated with chiropractic care when helpful.",

    reviews_hero_eyebrow: "Patient stories",
    reviews_hero_title: "Patient Reviews",
    reviews_hero_lede:
      "Voted Best Chiropractic Center and Best Massage in The Paris News reader polls. Below are stories adapted from public Google reviews (paraphrased, not copied word-for-word).",
    reviews_cta_heading: "Loved your visit? Leave us a review.",
    reviews_cta_body:
      "A few words on Google help other families find dependable, family-owned care in Northeast Texas. Each button opens your Google review link when configured in admin, otherwise Google Maps for that office.",

    patient_forms_hero_eyebrow: "Welcome to our practice",
    patient_forms_hero_title: "Patient forms",
    patient_forms_hero_lede:
      "Print this form, fill it out, and bring it to your massage or chiro appointment.",
    patient_forms_chiro_heading: "Chiro patient form",
    patient_forms_chiro_intro:
      "Chiropractic: new patient & personal injury form — Download, print, fill out by hand, and bring it in.",
    patient_forms_chiro_bullets: "",
    patient_forms_massage_heading: "Massage patient form",
    patient_forms_massage_body:
      "Print this form, fill it out, and bring it to your massage or chiro appointment.",
    patient_forms_inperson_heading: "Need help?",
    patient_forms_inperson_bullets: `- Call either office if you have questions about which form to bring.
- If you cannot print at home, arrive a few minutes early and we will have paper copies at the front desk.`,
  };

  TESTIMONIALS.forEach((t, i) => {
    const n = i + 1;
    defaults[`reviews_testimonial_${n}_quote`] = t.quote;
    defaults[`reviews_testimonial_${n}_author`] = t.author;
    defaults[`reviews_testimonial_${n}_context`] = t.context ?? "";
  });

  return defaults;
}

export const STATIC_PAGES_CMS_IDS = STATIC_PAGES_CMS_REGISTRY.map((f) => f.id);
