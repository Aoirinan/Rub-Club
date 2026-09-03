import type { ContentFieldMeta, ContentFieldType, ContentPageKey } from "@/lib/cms-registry";
import { CHIRO } from "@/lib/home-verbatim";
import { CHIRO_INTAKE_PACKET_PDF, MASSAGE_NEW_CLIENT_PDF } from "@/lib/privacy";
import { siteDescription, siteTitle } from "@/lib/site-content";
import { pageMetaDefaults, pageMetaFields, PAGE_META_SECTION } from "@/lib/page-meta-cms";

/**
 * Paris page-level copy (about, services hub, locations, contact, FAQ,
 * insurance, reviews, forms, book) that used to be hard-coded in the page
 * files. Every default is the exact text the site showed before the field
 * existed, so nothing changes until someone edits it.
 *
 * Templates: a few fields contain tokens that the page fills in at render
 * time — `{doctors}` (active doctor names) and `{schedule}` ("Book online or
 * call" / "Call or contact us to schedule").
 */

type Spec = {
  id: string;
  page: ContentPageKey;
  section: string;
  label: string;
  type?: ContentFieldType;
  def: string;
};

/** Open Graph title/description overrides for pages that had distinct social text. */
export function pageOgTitleId(key: string): string {
  return `page_${key}_og_title`;
}
export function pageOgDescriptionId(key: string): string {
  return `page_${key}_og_description`;
}

function ogSpecs(
  key: string,
  page: ContentPageKey,
  defs: { title?: string; description?: string },
  section: string = PAGE_META_SECTION,
): Spec[] {
  const out: Spec[] = [];
  if (defs.title !== undefined) {
    out.push({
      id: pageOgTitleId(key),
      page,
      section,
      label: "Social share title (Facebook / Messages preview)",
      def: defs.title,
    });
  }
  if (defs.description !== undefined) {
    out.push({
      id: pageOgDescriptionId(key),
      page,
      section,
      label: "Social share description",
      def: defs.description,
    });
  }
  return out;
}

const ONLINE_FORMS_META_SECTION = "Online forms page · search & browser title";

const SPECS: Spec[] = [
  // ── Home ──────────────────────────────────────────────────────────────
  {
    id: "home_location_phone_label",
    page: "Home",
    section: "Location block",
    label: "Phone label",
    def: "Chiropractic",
  },
  {
    id: "home_location_details_label",
    page: "Home",
    section: "Location block",
    label: "Paris details link",
    def: "Paris details & hours",
  },
  {
    id: "home_location_hours_label",
    page: "Home",
    section: "Location block",
    label: "Hours heading",
    def: "Chiropractic",
  },
  {
    id: "home_location_massage_hours_label",
    page: "Home",
    section: "Location block",
    label: "Massage hours heading",
    def: "Massage (The Rub Club)",
  },
  {
    id: "home_second_location_title",
    page: "Home",
    section: "Location block",
    label: "Second location card title",
    def: CHIRO.secondLocationTitle,
  },
  {
    id: "home_second_location_link_label",
    page: "Home",
    section: "Location block",
    label: "Second location link",
    def: "Sulphur Springs details & hours",
  },

  // ── Chiropractic page ────────────────────────────────────────────────
  {
    id: "chiro_location_phone_label",
    page: "Chiropractic",
    section: "Location block",
    label: "Phone label",
    def: "Chiropractic",
  },
  {
    id: "chiro_location_details_label",
    page: "Chiropractic",
    section: "Location block",
    label: "Paris details link",
    def: "Paris details & hours",
  },
  {
    id: "chiro_second_location_title",
    page: "Chiropractic",
    section: "Location block",
    label: "Second location card title",
    def: CHIRO.secondLocationTitle,
  },
  {
    id: "chiro_second_location_link_label",
    page: "Chiropractic",
    section: "Location block",
    label: "Second location link",
    def: "Sulphur Springs details & hours",
  },
  ...ogSpecs("chiropractic", "Chiropractic", {
    title: "Chiropractor in Paris, TX",
    description:
      "Adjustments, decompression, rehab, and acupuncture at Chiropractic Associates in Paris. {schedule}.",
  }),

  // ── Paris chiro service pages (shared) ───────────────────────────────
  {
    id: "paris_chiro_pages_eyebrow",
    page: "Paris chiro pages",
    section: "Shared on every service page",
    label: "Eyebrow above the page title",
    def: "Chiropractic Associates · Paris, TX",
  },
  {
    id: "paris_chiro_pages_title_suffix",
    page: "Paris chiro pages",
    section: "Shared on every service page",
    label: "Browser title suffix (after the page title)",
    def: " — Chiropractic Associates, Paris TX",
  },
  {
    id: "paris_chiro_pages_og_suffix",
    page: "Paris chiro pages",
    section: "Shared on every service page",
    label: "Social share title suffix",
    def: " — Paris, TX",
  },
  {
    id: "paris_chiro_pages_cta_body",
    page: "Paris chiro pages",
    section: "Shared on every service page",
    label: "Bottom CTA text (heading is Site text → “Schedule an appointment”)",
    def: "Contact our Paris office to discuss whether this treatment is right for you.",
  },
  {
    id: "paris_chiro_stretch_flex_exercises_heading",
    page: "Paris chiro pages",
    section: "Stretch & Flex Rehab",
    label: "Exercises section heading",
    def: "Exercises & movements",
  },
  {
    id: "paris_chiro_stretch_flex_image_alt",
    page: "Paris chiro pages",
    section: "Stretch & Flex Rehab",
    label: "Photo description for screen readers (logo + gallery)",
    def: "Stretch & Flex Rehab",
  },

  // ── Wellness care plans ──────────────────────────────────────────────
  {
    id: "wellness_page_title",
    page: "Wellness care plans",
    section: "Page",
    label: "Page title (heading at the top)",
    def: "Wellness care plans",
  },
  {
    id: "wellness_questions_prefix",
    page: "Wellness care plans",
    section: "Page",
    label: "Closing question",
    def: "Questions about which tier fits you?",
  },
  {
    id: "wellness_back_link_label",
    page: "Wellness care plans",
    section: "Page",
    label: "Back link",
    def: "Back to chiropractic services",
  },
  {
    id: "wellness_or_call",
    page: "Wellness care plans",
    section: "Page",
    label: "“or call” (before the phone number)",
    def: "or call",
  },
  {
    id: "wellness_book_label",
    page: "Wellness care plans",
    section: "Page",
    label: "Book button",
    def: "Book chiropractic",
  },
  {
    id: "wellness_call_prefix",
    page: "Wellness care plans",
    section: "Page",
    label: "Call button prefix (before the phone number)",
    def: "Call Paris",
  },
  ...ogSpecs("wellness_care_plans", "Wellness care plans", {
    title: "Wellness care plans — Chiropractic Associates",
    description:
      "Monthly wellness membership options for chiropractic, massage, therapy, and acupuncture in Paris, TX.",
  }),

  // ── About ────────────────────────────────────────────────────────────
  {
    id: "about_hero_eyebrow",
    page: "About",
    section: "Hero",
    label: "Eyebrow above the heading",
    def: "Family-owned since 1998",
  },
  {
    id: "about_hero_lede",
    page: "About",
    section: "Hero",
    label: "Intro paragraph",
    def: "Chiropractic Associates leads our family-owned care in Paris and Sulphur Springs, with licensed massage therapy at The Rub Club in Paris.",
  },
  {
    id: "about_story_heading",
    page: "About",
    section: "Story",
    label: "Section heading",
    def: "Two practices, one address",
  },
  {
    id: "about_awards_label",
    page: "About",
    section: "Story",
    label: "Awards label",
    def: "Awards: ",
  },
  {
    id: "about_awards_text",
    page: "About",
    section: "Story",
    label: "Awards sentence",
    def: CHIRO.awards,
  },
  {
    id: "about_photo_alt",
    page: "About",
    section: "Story",
    label: "Photo description for screen readers",
    def: "Chiropractic Associates team at the Paris office",
  },
  {
    id: "about_doctors_heading",
    page: "About",
    section: "Doctors",
    label: "Section heading",
    def: "Our Paris Chiropractors",
  },
  {
    id: "about_doctors_intro",
    page: "About",
    section: "Doctors",
    label: "Intro sentence ({doctors} = the active doctors' names)",
    def: "{doctors} practice in Paris.",
  },
  {
    id: "about_doctors_link_label",
    page: "About",
    section: "Doctors",
    label: "Link to the Paris staff page",
    def: "About us — Paris office",
  },
  {
    id: "about_cta_title",
    page: "About",
    section: "Bottom CTA",
    label: "Heading",
    def: "Ready to visit?",
  },
  {
    id: "about_cta_body",
    page: "About",
    section: "Bottom CTA",
    label: "Text",
    def: "Book chiropractic or massage online, or call either office and we will help you find a time.",
  },
  {
    id: "about_cta_book_label",
    page: "About",
    section: "Bottom CTA",
    label: "Book button",
    def: "Book chiropractic",
  },
  {
    id: "about_cta_secondary_label",
    page: "About",
    section: "Bottom CTA",
    label: "Second button",
    def: "Contact us",
  },
  ...ogSpecs("about", "About", {
    title: "About — Chiropractic Associates",
    description:
      "Family-owned wellness in Paris and Sulphur Springs, TX. Best Chiropractic Center and Best Massage in The Paris News reader polls.",
  }),

  // ── Services hub ─────────────────────────────────────────────────────
  {
    id: "services_hub_wellness_link_label",
    page: "Services hub",
    section: "Chiropractic card",
    label: "Wellness plans link",
    def: "Wellness care plans (Paris)",
  },
  {
    id: "services_hub_book_chiro_label",
    page: "Services hub",
    section: "Chiropractic card",
    label: "Book link (when online booking is on)",
    def: "Book chiropractic online",
  },
  {
    id: "services_hub_book_massage_label",
    page: "Services hub",
    section: "Massage card",
    label: "Book link (when online booking is on)",
    def: "Book massage online",
  },

  // ── Paris location page ──────────────────────────────────────────────
  {
    id: "paris_location_eyebrow",
    page: "Paris / main office",
    section: "Location page",
    label: "Eyebrow above the heading",
    def: "Main office · Paris, TX",
  },
  {
    id: "paris_location_title_prefix",
    page: "Paris / main office",
    section: "Location page",
    label: "Heading prefix (before the street address)",
    def: "Paris, TX — ",
  },
  {
    id: "paris_location_lede",
    page: "Paris / main office",
    section: "Location page",
    label: "Intro paragraph",
    def: "Both Chiropractic Associates and The Rub Club operate from this address. Easy parking, friendly front desk, weekday hours.",
  },
  {
    id: "paris_location_hours_label",
    page: "Paris / main office",
    section: "Location page",
    label: "Chiropractic hours heading",
    def: "Chiropractic Associates",
  },
  {
    id: "paris_location_massage_hours_label",
    page: "Paris / main office",
    section: "Location page",
    label: "Massage hours heading",
    def: "The Rub Club (massage)",
  },
  {
    id: "paris_location_staff_link_label",
    page: "Paris / main office",
    section: "Location page",
    label: "Staff page link",
    def: "About us — Paris office",
  },
  {
    id: "paris_location_massage_link_label",
    page: "Paris / main office",
    section: "Location page",
    label: "Massage team link",
    def: "Meet The Rub Club massage therapists",
  },
  ...ogSpecs("locations_paris", "Paris / main office", {
    title: "Paris, TX — Chiropractic & Massage Therapy",
    description:
      "Main office at 3305 NE Loop 286, Suite A, Paris, TX 75460. Chiropractic Associates and The Rub Club.",
  }),

  // ── Paris staff page ─────────────────────────────────────────────────
  {
    id: "paris_staff_eyebrow",
    page: "Paris staff",
    section: "Page hero",
    label: "Eyebrow above the heading",
    def: "Chiropractic Associates · Paris, TX",
  },
  {
    id: "paris_staff_massage_note",
    page: "Paris staff",
    section: "Team grid",
    label: "Massage therapists note (before the link)",
    def: "Looking for massage therapists?",
  },
  {
    id: "paris_staff_massage_link_label",
    page: "Paris staff",
    section: "Team grid",
    label: "Massage therapists link",
    def: "Meet The Rub Club team",
  },
  ...ogSpecs("paris_staff", "Paris staff", {
    title: "About Us — Paris, TX",
    description:
      "Doctors and office team at our Paris main office — insurance, personal injury, front desk, and support staff.",
  }),

  // ── Contact ──────────────────────────────────────────────────────────
  {
    id: "contact_massage_desk_note",
    page: "Contact",
    section: "Office card",
    label: "Note after the massage phone",
    def: "(massage desk)",
  },
  {
    id: "contact_directions_label",
    page: "Contact",
    section: "Office card",
    label: "Directions button",
    def: "Get Directions",
  },
  {
    id: "contact_details_label",
    page: "Contact",
    section: "Office card",
    label: "Location details button",
    def: "Location Details",
  },
  {
    id: "contact_hours_heading",
    page: "Contact",
    section: "Hours",
    label: "Heading",
    def: "Hours",
  },
  {
    id: "contact_chiro_hours_label",
    page: "Contact",
    section: "Hours",
    label: "Chiropractic hours label",
    def: "Chiropractic Associates",
  },
  {
    id: "contact_massage_hours_label",
    page: "Contact",
    section: "Hours",
    label: "Massage hours label",
    def: "The Rub Club (massage)",
  },
  ...ogSpecs("contact", "Contact", {
    title: "Contact — Chiropractic Associates, Paris",
    description:
      "Phone, hours, and contact form for our Paris, TX office. Sulphur Springs has its own contact page.",
  }),

  // ── FAQ ──────────────────────────────────────────────────────────────
  {
    id: "faq_eyebrow",
    page: "FAQ",
    section: "Hero",
    label: "Eyebrow above the heading",
    def: "Good to know",
  },
  {
    id: "faq_cta_title",
    page: "FAQ",
    section: "Bottom CTA",
    label: "Heading",
    def: "Still have a question?",
  },
  {
    id: "faq_cta_body",
    page: "FAQ",
    section: "Bottom CTA",
    label: "Text",
    def: "The fastest way to reach us is by phone during office hours, or send a message and we'll respond as soon as we can.",
  },
  {
    id: "faq_cta_contact_label",
    page: "FAQ",
    section: "Bottom CTA",
    label: "Contact button",
    def: "Contact us",
  },
  {
    id: "faq_call_prefix",
    page: "FAQ",
    section: "Bottom CTA",
    label: "Call button prefix (before the phone number)",
    def: "Call Paris",
  },
  ...ogSpecs("faq", "FAQ", {
    title: "FAQ — Chiropractic Associates",
    description:
      "Insurance, scheduling, and first-visit answers for our Paris and Sulphur Springs offices.",
  }),

  // ── Insurance ────────────────────────────────────────────────────────
  {
    id: "insurance_eyebrow",
    page: "Insurance",
    section: "Hero",
    label: "Eyebrow above the heading",
    def: "Insurance & billing",
  },
  {
    id: "insurance_paperwork_prefix",
    page: "Insurance",
    section: "Chiropractic",
    label: "Paperwork note (before the link)",
    def: "Auto-injury and personal-injury paperwork:",
  },
  {
    id: "insurance_paperwork_link_label",
    page: "Insurance",
    section: "Chiropractic",
    label: "Paperwork note link",
    def: "About us — Paris office",
  },
  {
    id: "insurance_paperwork_suffix",
    page: "Insurance",
    section: "Chiropractic",
    label: "Paperwork note (after the link)",
    def: "(including our personal injury case manager).",
  },
  {
    id: "insurance_call_paris_label",
    page: "Insurance",
    section: "Verify",
    label: "Paris call link prefix",
    def: "Call Paris: ",
  },
  {
    id: "insurance_call_ss_label",
    page: "Insurance",
    section: "Verify",
    label: "Sulphur Springs call link prefix",
    def: "Call Sulphur Springs: ",
  },
  {
    id: "insurance_cta_title",
    page: "Insurance",
    section: "Bottom CTA",
    label: "Heading",
    def: "Have benefits to use before year-end?",
  },
  {
    id: "insurance_cta_body",
    page: "Insurance",
    section: "Bottom CTA",
    label: "Text",
    def: "Book a visit while you still have flexible-spending or out-of-pocket dollars to use.",
  },
  {
    id: "insurance_cta_secondary_label",
    page: "Insurance",
    section: "Bottom CTA",
    label: "Second button",
    def: "Talk to billing",
  },
  ...ogSpecs("insurance", "Insurance", {
    title: "Insurance & Billing — Chiropractic Associates",
    description:
      "Insurance accepted for chiropractic care; massage therapy is self-pay. Call to verify benefits before your visit.",
  }),

  // ── Reviews ──────────────────────────────────────────────────────────
  ...ogSpecs("reviews", "Reviews", {
    title: "Patient Reviews — Chiropractic Associates",
    description: "Read patient stories and leave us a Google review.",
  }),

  // ── Patient forms ────────────────────────────────────────────────────
  {
    id: "patient_forms_online_heading",
    page: "Patient forms",
    section: "Online forms",
    label: "Heading",
    def: "Complete your forms online",
  },
  {
    id: "patient_forms_online_body",
    page: "Patient forms",
    section: "Online forms",
    label: "Text",
    def: "Prefer to fill everything out from your phone or computer? Complete your intake and consent forms online before your visit — no printing required.",
  },
  {
    id: "patient_forms_online_button",
    page: "Patient forms",
    section: "Online forms",
    label: "Button",
    def: "Go to online patient forms",
  },
  {
    id: "patient_forms_chiro_pdf_label",
    page: "Patient forms",
    section: "Chiropractic PDF",
    label: "Download button",
    def: "Download chiropractic intake packet (PDF)",
  },
  {
    id: "patient_forms_chiro_pdf_url",
    page: "Patient forms",
    section: "Chiropractic PDF",
    label: "PDF file (URL or path)",
    type: "url",
    def: CHIRO_INTAKE_PACKET_PDF,
  },
  {
    id: "patient_forms_massage_pdf_label",
    page: "Patient forms",
    section: "Massage PDF",
    label: "Download button",
    def: "Download massage new-client form (PDF)",
  },
  {
    id: "patient_forms_massage_pdf_url",
    page: "Patient forms",
    section: "Massage PDF",
    label: "PDF file (URL or path)",
    type: "url",
    def: MASSAGE_NEW_CLIENT_PDF,
  },
  {
    id: "patient_forms_wellness_prefix",
    page: "Patient forms",
    section: "In person",
    label: "Wellness note (before the link)",
    def: "Interested in ongoing chiropractic wellness options? See our",
  },
  {
    id: "patient_forms_wellness_link_label",
    page: "Patient forms",
    section: "In person",
    label: "Wellness note link",
    def: "wellness care plans overview",
  },
  ...ogSpecs("patient_forms", "Patient forms", {
    title: "Patient Forms — Chiropractic Associates",
    description:
      "Chiropractic and massage intake forms for Paris and Sulphur Springs — printable PDF downloads.",
  }),

  // ── Online forms index page ──────────────────────────────────────────
  {
    id: "online_forms_eyebrow",
    page: "Patient forms",
    section: "Online forms page",
    label: "Eyebrow above the heading",
    def: "Before Your Visit",
  },
  {
    id: "online_forms_title",
    page: "Patient forms",
    section: "Online forms page",
    label: "Heading",
    def: "ONLINE PATIENT FORMS",
  },
  {
    id: "online_forms_lede",
    page: "Patient forms",
    section: "Online forms page",
    label: "Intro paragraph",
    def: "Save time at your appointment by completing your paperwork online.",
  },
  {
    id: "online_forms_unavailable_prefix",
    page: "Patient forms",
    section: "Online forms page",
    label: "Unavailable notice (before the link)",
    def: "Our online forms are temporarily unavailable. Please",
  },
  {
    id: "online_forms_unavailable_link_label",
    page: "Patient forms",
    section: "Online forms page",
    label: "Unavailable notice link",
    def: "download the printable patient forms",
  },
  {
    id: "online_forms_unavailable_suffix",
    page: "Patient forms",
    section: "Online forms page",
    label: "Unavailable notice (after the link)",
    def: "or call our office and we'll be glad to help.",
  },
  {
    id: "online_forms_start_label",
    page: "Patient forms",
    section: "Online forms page",
    label: "Start link",
    def: "Start →",
  },

  // ── Book page ────────────────────────────────────────────────────────
  {
    id: "book_breadcrumb_home",
    page: "Booking page",
    section: "Page",
    label: "Breadcrumb: home",
    def: "Home",
  },
  {
    id: "book_breadcrumb_current",
    page: "Booking page",
    section: "Page",
    label: "Breadcrumb: this page",
    def: "Book",
  },
  {
    id: "book_title",
    page: "Booking page",
    section: "Booking turned off",
    label: "Heading",
    def: "Book an appointment",
  },
  {
    id: "book_off_heading",
    page: "Booking page",
    section: "Booking turned off",
    label: "Notice heading",
    def: "Online booking is currently off",
  },
  {
    id: "book_off_body",
    page: "Booking page",
    section: "Booking turned off",
    label: "Notice text",
    def: "Please call and we will schedule your visit directly.",
  },
  {
    id: "book_call_paris_prefix",
    page: "Booking page",
    section: "Booking turned off",
    label: "Paris call button prefix",
    def: "Call Paris",
  },
  {
    id: "book_call_ss_prefix",
    page: "Booking page",
    section: "Booking turned off",
    label: "Sulphur Springs call button prefix",
    def: "Call Sulphur Springs",
  },
  ...ogSpecs("book", "Booking page", {
    description:
      "Online scheduling for Chiropractic Associates and The Rub Club in Paris and Sulphur Springs, TX.",
  }),
];

/** Browser title / search description per page (key → pageLabel + defaults). */
const META: { key: string; page: ContentPageKey; section?: string; title: string; description: string }[] = [
  { key: "home", page: "Home", title: siteTitle, description: siteDescription },
  {
    key: "about",
    page: "About",
    title: "About Us — Family-owned wellness in Northeast Texas",
    description:
      "Since 1998, Chiropractic Associates and The Rub Club have delivered family-owned chiropractic care and licensed massage therapy in Paris and Sulphur Springs, TX.",
  },
  {
    key: "services",
    page: "Services hub",
    title: "Services — Chiropractic & Massage in Paris & Sulphur Springs, TX",
    description:
      "Chiropractic care, wellness memberships, and therapeutic massage at Chiropractic Associates and The Rub Club in Paris and Sulphur Springs, TX.",
  },
  {
    key: "chiropractic",
    page: "Chiropractic",
    title: "Chiropractor in Paris, TX — Chiropractic Associates",
    description:
      "Chiropractic adjustments, spinal decompression, rehab, and acupuncture in Paris, TX. {schedule} — family-owned since 1998.",
  },
  {
    key: "wellness_care_plans",
    page: "Wellness care plans",
    title: "Wellness Care Plans — Chiropractic Associates, Paris, TX",
    description:
      "Chiro-Fitness and Acu-Fit monthly wellness memberships: adjustments, massage combos, therapy, acupuncture, and rehab sessions at our Paris, TX office.",
  },
  {
    key: "locations_paris",
    page: "Paris / main office",
    title: "Paris, TX office — Chiropractic Associates & The Rub Club",
    description:
      "Visit our Paris main office at 3305 NE Loop 286, Suite A. Chiropractic Associates and The Rub Club massage share the same address. Free parking, weekday hours.",
  },
  {
    key: "paris_staff",
    page: "Paris staff",
    title: "About Us — Paris, TX Office",
    description:
      "Meet the Chiropractic Associates Paris team — doctors, insurance coordinators, front desk, therapy tech, and support staff.",
  },
  {
    key: "contact",
    page: "Contact",
    title: "Contact — Chiropractic Associates, Paris, TX",
    description:
      "Phone number, address, and hours for The Rub Club and Chiropractic Associates in Paris, TX. Call us directly.",
  },
  {
    key: "faq",
    page: "FAQ",
    title: "Frequently Asked Questions",
    description:
      "Answers about insurance, cancellation, what to bring, pricing, and what to expect at your first chiropractic or massage appointment in Paris, TX.",
  },
  {
    key: "insurance",
    page: "Insurance",
    title: "Insurance & Billing",
    description:
      "What to expect with insurance for chiropractic visits, plus self-pay information for massage therapy at The Rub Club. Call our Paris office to verify benefits.",
  },
  {
    key: "reviews",
    page: "Reviews",
    title: "Patient Reviews",
    description:
      "Hear what our patients say about Chiropractic Associates and The Rub Club in Paris, TX, then leave your own review on Google.",
  },
  {
    key: "patient_forms",
    page: "Patient forms",
    title: "Patient Forms",
    description:
      "Download chiropractic new patient and personal injury intake paperwork and massage new-client forms for your visit in Paris or Sulphur Springs, TX.",
  },
  {
    key: "online_forms",
    page: "Patient forms",
    section: ONLINE_FORMS_META_SECTION,
    title: "Online Patient Forms",
    description:
      "Complete your chiropractic, massage, pediatric, or accident intake paperwork online before your visit to Chiropractic Associates in Paris or Sulphur Springs, TX.",
  },
  {
    key: "book",
    page: "Booking page",
    title: "Book an Appointment",
    description:
      "Book massage therapy or chiropractic care online in Paris or Sulphur Springs, TX. See real-time openings and request a time in under a minute.",
  },
];

export const PARIS_PAGES_CMS_REGISTRY: ContentFieldMeta[] = [
  ...SPECS.map((s) => ({
    id: s.id,
    pageLabel: s.page,
    sectionLabel: s.section,
    fieldLabel: s.label,
    type: s.type ?? "text",
  })),
  ...META.flatMap((m) => pageMetaFields(m.key, m.page, m.section)),
];

export const PARIS_PAGES_CMS_DEFAULTS: Record<string, string> = {
  ...Object.fromEntries(SPECS.map((s) => [s.id, s.def])),
  ...Object.assign(
    {},
    ...META.map((m) => pageMetaDefaults(m.key, { title: m.title, description: m.description })),
  ),
};

/**
 * CMS value with the built-in default as fallback (blank → default). Values
 * are returned untrimmed: several fields are prefixes/suffixes whose leading
 * or trailing space is part of the text (e.g. "Call Paris: ", " — Paris, TX").
 */
export function parisText(c: Record<string, string>, id: string): string {
  const v = c[id];
  if (typeof v === "string" && v.trim()) return v;
  return PARIS_PAGES_CMS_DEFAULTS[id] ?? "";
}

/** Optional override: blank means "use the page's own fallback". */
export function parisOptional(c: Record<string, string>, id: string): string | undefined {
  const v = c[id]?.trim();
  return v ? v : undefined;
}

/** Join names as "A, B, and C" (Oxford comma), matching the previous literal copy. */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}
