import type { ContentFieldMeta, ContentFieldType, ContentPageKey } from "@/lib/cms-registry";
import { MASSAGE } from "@/lib/home-verbatim";
import { pageMetaDefaults, pageMetaFields, PAGE_META_SECTION } from "@/lib/page-meta-cms";
import { CHIRO_INTAKE_PACKET_PDF, MASSAGE_NEW_CLIENT_PDF } from "@/lib/privacy";
import { SS_PATIENT_RESOURCES } from "@/lib/sulphur-springs-content";

/**
 * Sulphur Springs page-level copy that used to be hard-coded: eyebrows, CTA
 * cards, section headings, button labels, browser titles. Every default is the
 * exact text the page showed before it became editable, so nothing changes on
 * the site until someone edits a field.
 */

type Spec = [id: string, page: ContentPageKey, section: string, label: string, def: string, type?: ContentFieldType];

/** Helper-links list: one "Label | URL" per line. */
export const SS_PATIENT_RESOURCES_LINKS_DEFAULT = SS_PATIENT_RESOURCES.links
  .map((l) => `${l.label} | ${l.url}`)
  .join("\n");

export function parseLabelUrlLines(text: string): { label: string; url: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.lastIndexOf("|");
      if (idx === -1) return null;
      const label = line.slice(0, idx).trim();
      const url = line.slice(idx + 1).trim();
      return label && /^https?:\/\//i.test(url) ? { label, url } : null;
    })
    .filter((l): l is { label: string; url: string } => l !== null);
}

const SUBPAGE_SHARED = "Shared on every service page";

const SPECS: Spec[] = [
  // ── Home (/sulphur-springs) ──
  ["page_ss_home_og_description", "Sulphur Springs", PAGE_META_SECTION, "Social share description", "Chiropractic care, spinal decompression, and massage therapy in Sulphur Springs, TX. Call 903-919-5020."],

  // ── Service / condition / resource pages ([slug]) ──
  ["ss_subpage_eyebrow", "SS subpages", SUBPAGE_SHARED, "Eyebrow above the page title", "Chiropractic Associates · Sulphur Springs"],
  ["ss_subpage_meta_title_suffix", "SS subpages", SUBPAGE_SHARED, "Browser title suffix (after the page title)", "— Sulphur Springs Chiropractic"],
  ["ss_subpage_og_title_suffix", "SS subpages", SUBPAGE_SHARED, "Social share title suffix", "— Sulphur Springs, TX"],
  ["ss_subpage_cta_service_body", "SS subpages", SUBPAGE_SHARED, "Bottom card text (treatment pages)", "Contact our Sulphur Springs office to discuss whether this treatment is right for you."],
  ["ss_subpage_cta_injury_heading", "SS subpages", SUBPAGE_SHARED, "Bottom card heading (injury pages)", "Need treatment?"],
  ["ss_subpage_cta_injury_body", "SS subpages", SUBPAGE_SHARED, "Bottom card text (injury pages)", "Contact our Sulphur Springs office for a thorough examination."],
  ["ss_subpage_cta_resource_heading", "SS subpages", SUBPAGE_SHARED, "Bottom card heading (resource articles)", "Have questions?"],
  ["ss_subpage_cta_resource_body", "SS subpages", SUBPAGE_SHARED, "Bottom card text (resource articles)", "Contact our Sulphur Springs office and our team will be happy to help."],

  // ── Contact ──
  ["page_ss_contact_og_title", "SS contact page", PAGE_META_SECTION, "Social share title", "Contact Chiropractic Associates of Sulphur Springs"],
  ["page_ss_contact_og_description", "SS contact page", PAGE_META_SECTION, "Social share description", "Phone, hours, and directions for our Sulphur Springs, TX office. Call 903-919-5020."],
  ["ss_contact_eyebrow", "SS contact page", "Hero", "Eyebrow above the title", "Chiropractic Associates · Sulphur Springs"],
  ["ss_contact_directions_label", "SS contact page", "Buttons", "Directions button", "Get directions"],
  ["ss_contact_details_label", "SS contact page", "Buttons", "Location details button", "Location details"],

  // ── Insurance ──
  ["page_ss_insurance_og_description", "SS insurance", PAGE_META_SECTION, "Social share description", "Insurance accepted for chiropractic care; massage therapy is self-pay. Call our Sulphur Springs office to verify benefits."],
  ["ss_insurance_eyebrow", "SS insurance", "Hero", "Eyebrow above the title", "Insurance & billing"],
  ["ss_insurance_paperwork_prefix", "SS insurance", "Chiropractic", "Paperwork note (before the link)", "Auto-injury and personal-injury paperwork:"],
  ["ss_insurance_paperwork_link_label", "SS insurance", "Chiropractic", "Paperwork note link text", "About us — Sulphur Springs office"],
  ["ss_insurance_call_prefix", "SS insurance", "Verify", "Call link prefix (before the phone number)", "Call Sulphur Springs:"],
  ["ss_insurance_cta_heading", "SS insurance", "Bottom card", "Heading", "Have benefits to use before year-end?"],
  ["ss_insurance_cta_body", "SS insurance", "Bottom card", "Text", "Book a visit while you still have flexible-spending or out-of-pocket dollars to use."],
  ["ss_insurance_cta_button", "SS insurance", "Bottom card", "Button", "Talk to billing"],

  // ── Massage ──
  ["page_ss_massage_og_description", "SS massage page", PAGE_META_SECTION, "Social share description", "Therapeutic massage in Sulphur Springs, TX — coordinated with your chiropractic care."],
  ["ss_massage_eyebrow", "SS massage page", "Hero", "Eyebrow above the title", "Chiropractic Associates · Sulphur Springs, TX"],
  ["ss_massage_intro_photo_alt", "SS massage page", "Intro", "Intro photo description (alt text)", "A licensed massage therapist working on a client's shoulders"],
  ["ss_massage_services_heading", "SS massage page", "Massage services", "Section heading", "Massage services"],
  ["ss_massage_chiro_link_prefix", "SS massage page", "Massage services", "Chiropractic cross-link (before the link)", "Need more than soft-tissue work?"],
  ["ss_massage_chiro_link_label", "SS massage page", "Massage services", "Chiropractic cross-link text", "Explore our chiropractic care"],
  ["ss_massage_chiro_link_suffix", "SS massage page", "Massage services", "Chiropractic cross-link (after the link)", "— our massage and chiropractic teams coordinate care under one roof."],
  ["ss_massage_when_heading", "SS massage page", "When to get a massage", "Heading", "When to get a massage"],
  ["ss_massage_when_body", "SS massage page", "When to get a massage", "Paragraph", MASSAGE.whenBody],
  ["ss_massage_team_heading", "SS massage page", "Meet the team", "Heading", "Meet the team"],
  ["ss_massage_team_subtitle", "SS massage page", "Meet the team", "Subheading", "Licensed massage therapists in Sulphur Springs"],
  ["ss_massage_team_footnote_prefix", "SS massage page", "Meet the team", "Footnote (before the link)", "For our chiropractor, front desk, and rehab team, see"],
  ["ss_massage_team_footnote_link_label", "SS massage page", "Meet the team", "Footnote link text", "About us — Sulphur Springs"],
  ["ss_massage_visit_heading", "SS massage page", "Visit us", "Heading", "Visit us in Sulphur Springs"],
  ["ss_massage_office_label", "SS massage page", "Visit us", "Phone label", "Sulphur Springs office:"],
  ["ss_massage_request_button", "SS massage page", "Visit us", "Request button", "Request appointment"],
  ["ss_massage_prices_button", "SS massage page", "Visit us", "Prices button", "View prices"],
  ["ss_massage_chiro_button", "SS massage page", "Visit us", "Chiropractic button", "Sulphur Springs chiropractic"],
  ["ss_massage_cta_heading", "SS massage page", "Bottom card", "Heading", "Have a question first?"],
  ["ss_massage_cta_body", "SS massage page", "Bottom card", "Text", "Our front desk can verify available times and answer questions about specific conditions."],

  // ── Massage prices ──
  ["page_ss_massage_prices_og_title", "SS prices", PAGE_META_SECTION, "Social share title", "Massage Prices — Sulphur Springs, TX"],
  ["ss_prices_eyebrow", "SS prices", "Hero", "Eyebrow above the title", "Chiropractic Associates · Sulphur Springs, TX"],
  ["ss_prices_title", "SS prices", "Hero", "Page title", "Massage Prices"],
  ["ss_prices_cta_heading", "SS prices", "Bottom card", "Heading", "Book your massage"],
  ["ss_prices_cta_body", "SS prices", "Bottom card", "Text", "Call our Sulphur Springs office and we'll find a time that works for you."],

  // ── Patient forms ──
  ["page_ss_patient_forms_og_description", "SS patient forms", PAGE_META_SECTION, "Social share description", "Chiropractic and massage intake forms for Sulphur Springs — printable PDF downloads."],
  ["ss_patient_forms_online_heading", "SS patient forms", "Online forms", "Heading", "Complete your forms online"],
  ["ss_patient_forms_online_body", "SS patient forms", "Online forms", "Text", "Prefer to fill everything out from your phone or computer? Complete your intake and consent forms online before your visit — no printing required."],
  ["ss_patient_forms_online_button", "SS patient forms", "Online forms", "Button", "Go to online patient forms"],
  ["ss_patient_forms_chiro_pdf_label", "SS patient forms", "Chiropractic PDF", "Download button", "Download chiropractic intake packet (PDF)"],
  ["ss_patient_forms_chiro_pdf_url", "SS patient forms", "Chiropractic PDF", "PDF file link", CHIRO_INTAKE_PACKET_PDF, "url"],
  ["ss_patient_forms_massage_pdf_label", "SS patient forms", "Massage PDF", "Download button", "Download massage new-client form (PDF)"],
  ["ss_patient_forms_massage_pdf_url", "SS patient forms", "Massage PDF", "PDF file link", MASSAGE_NEW_CLIENT_PDF, "url"],
  ["ss_patient_forms_wellness_prefix", "SS patient forms", "In person", "Wellness note (before the link)", "Interested in ongoing chiropractic wellness options? See our"],
  ["ss_patient_forms_wellness_link_label", "SS patient forms", "In person", "Wellness note link text", "wellness care plans overview"],

  // ── Patient resources ──
  ["page_ss_patient_resources_og_title", "SS patient resources", PAGE_META_SECTION, "Social share title", "Patient Resources — Sulphur Springs, TX"],
  ["ss_patient_resources_eyebrow", "SS patient resources", "Patient resources landing page", "Eyebrow above the title", "Chiropractic Associates · Sulphur Springs"],
  ["ss_patient_resources_title", "SS patient resources", "Patient resources landing page", "Page title", "Patient Resources"],
  ["ss_patient_resources_about_heading", "SS patient resources", "Patient resources landing page", "About Chiropractic heading", "About Chiropractic"],
  ["ss_patient_resources_about_lede", "SS patient resources", "Patient resources landing page", "About Chiropractic lead-in", "Learn more about how chiropractic works and why it helps:"],
  ["ss_patient_resources_links_heading", "SS patient resources", "Patient resources landing page", "Helpful links heading", "Helpful Links"],
  ["ss_patient_resources_links", "SS patient resources", "Patient resources landing page", "Helpful links (one per line: Label | URL)", SS_PATIENT_RESOURCES_LINKS_DEFAULT, "richtext"],
  ["ss_patient_resources_cta_heading", "SS patient resources", "Patient resources landing page", "Bottom card heading", "Have questions?"],
  ["ss_patient_resources_cta_body", "SS patient resources", "Patient resources landing page", "Bottom card text", "Contact our Sulphur Springs office — we're happy to help."],

  // ── Q & A ──
  ["page_ss_q_and_a_og_title", "SS patient resources", "Q & A page", "Social share title", "Q & A — Sulphur Springs, TX"],
  ["ss_q_and_a_eyebrow", "SS patient resources", "Q & A page", "Eyebrow above the title", "Chiropractic Associates · Sulphur Springs"],
  ["ss_q_and_a_title", "SS patient resources", "Q & A page", "Page title", "Questions & Answers"],
  ["ss_q_and_a_cta_heading", "SS patient resources", "Q & A page", "Bottom card heading", "Still have questions?"],
  ["ss_q_and_a_cta_body", "SS patient resources", "Q & A page", "Bottom card text", "Contact our Sulphur Springs office — we're happy to help."],

  // ── Reviews ──
  ["page_ss_reviews_og_description", "SS reviews", PAGE_META_SECTION, "Social share description", "Read patient stories and leave us a Google review."],

  // ── Staff ──
  ["page_ss_staff_og_description", "Sulphur staff", PAGE_META_SECTION, "Social share description", "Dr. Conner Collins leads a dedicated team of massage therapists, rehab specialists, and support staff in Sulphur Springs, TX."],
  ["ss_staff_eyebrow", "Sulphur staff", "Page hero", "Eyebrow above the title", "Chiropractic Associates · Sulphur Springs"],

  // ── Wellness care plans ──
  ["page_ss_wellness_og_title", "SS wellness", PAGE_META_SECTION, "Social share title", "Wellness care plans — Sulphur Springs, TX"],
  ["page_ss_wellness_og_description", "SS wellness", PAGE_META_SECTION, "Social share description", "Monthly wellness membership options for chiropractic, massage, therapy, and rehab in Sulphur Springs, TX."],
  ["ss_wellness_title", "SS wellness", "Hero", "Page title", "Wellness care plans"],
  ["ss_wellness_questions_prefix", "SS wellness", "Closing", "Questions note (before the link)", "Questions about which tier fits you?"],
  ["ss_wellness_back_link_label", "SS wellness", "Closing", "Questions note link text", "Back to Sulphur Springs chiropractic"],
  ["ss_wellness_questions_or_call", "SS wellness", "Closing", "Questions note (before the phone number)", "or call"],
  ["ss_wellness_book_button", "SS wellness", "Bottom CTA", "Book button", "Book chiropractic"],
  ["ss_wellness_call_prefix", "SS wellness", "Bottom CTA", "Call button prefix (before the phone number)", "Call Sulphur Springs"],

  // ── Location page (/locations/sulphur-springs) ──
  ["page_locations_ss_og_title", "SS / office", PAGE_META_SECTION, "Social share title", "Sulphur Springs, TX — Chiropractic Associates"],
  ["page_locations_ss_og_description", "SS / office", PAGE_META_SECTION, "Social share description", "207 Jefferson St. E, Sulphur Springs, TX. Chiropractic adjustments, decompression, and rehab."],
  ["locations_ss_eyebrow", "SS / office", "Location page", "Eyebrow above the title", "Second office · Sulphur Springs, TX"],
  ["locations_ss_title_prefix", "SS / office", "Location page", "Title (the street address is added after it)", "Sulphur Springs, TX —"],
  ["locations_ss_lede", "SS / office", "Location page", "Intro paragraph", "Chiropractic Associates' second location, conveniently located on Jefferson St. E with weekday hours."],
];

const META: [key: string, page: ContentPageKey, title: string, description: string][] = [
  ["ss_home", "Sulphur Springs", "Sulphur Springs, TX Chiropractor — Chiropractic Associates", "Chiropractic Associates of Sulphur Springs offers chiropractic adjustments, spinal decompression, massage therapy, and rehabilitation at 207 Jefferson St. E. Call 903-919-5020."],
  ["ss_contact", "SS contact page", "Contact us — Chiropractic Associates of Sulphur Springs", "Phone number, address, and hours for Chiropractic Associates of Sulphur Springs at 207 Jefferson St. E. Call 903-919-5020."],
  ["ss_insurance", "SS insurance", "Insurance & Billing — Sulphur Springs", "What to expect with insurance for chiropractic visits, plus self-pay information for massage therapy at our Sulphur Springs office."],
  ["ss_massage", "SS massage page", "Massage Therapy in Sulphur Springs, TX — Chiropractic Associates", "Therapeutic massage to complement chiropractic care in Sulphur Springs, TX. Call 903-919-5020 to ask about availability."],
  ["ss_massage_prices", "SS prices", "Massage Prices — Chiropractic Associates, Sulphur Springs, TX", "Massage session rates, add-ons, gift certificate packages, memberships, and Chiro-Fitness pricing in Sulphur Springs, TX."],
  ["ss_patient_forms", "SS patient forms", "Patient Forms — Sulphur Springs", "Download chiropractic new patient and personal injury intake paperwork and massage new-client forms for your visit in Sulphur Springs, TX."],
  ["ss_patient_resources", "SS patient resources", "Patient Resources — Sulphur Springs Chiropractic", "Chiropractic patient resources, helpful links, and educational topics from Chiropractic Associates of Sulphur Springs."],
  ["ss_reviews", "SS reviews", "Patient Reviews — Sulphur Springs", "Hear what our patients say about Chiropractic Associates in Sulphur Springs, TX, then leave your own review on Google."],
  ["ss_staff", "Sulphur staff", "About Us — Sulphur Springs Chiropractic", "Meet Dr. Conner Collins and the care team at Chiropractic Associates of Sulphur Springs. Chiropractor, massage therapists, rehab therapy, and front-desk staff serving Hopkins County, TX."],
  ["ss_wellness", "SS wellness", "Wellness Care Plans — Chiropractic Associates, Sulphur Springs, TX", "Chiro-Fitness monthly wellness memberships: adjustments, massage combos, therapy, and rehab sessions at our Sulphur Springs, TX office."],
  ["locations_ss", "SS / office", "Sulphur Springs, TX chiropractor — Chiropractic Associates", "Visit our Sulphur Springs chiropractic office at 207 Jefferson St. E. Adjustments, decompression, and rehab care from Dr. Conner Collins and the Chiropractic Associates team."],
];

/** Q & A meta lives in the Patient resources scope (the Q & A entries themselves are FAQ items). */
const Q_AND_A_META = {
  key: "ss_q_and_a",
  page: "SS patient resources" as ContentPageKey,
  title: "Q & A — Sulphur Springs Chiropractic",
  description: "Frequently asked questions about chiropractic care at Chiropractic Associates of Sulphur Springs.",
};

/** Sulphur Springs page-level copy that used to be hard-coded. */
export const SS_PAGES_CMS_REGISTRY: ContentFieldMeta[] = [
  ...META.flatMap(([key, page]) => pageMetaFields(key, page)),
  ...pageMetaFields(Q_AND_A_META.key, Q_AND_A_META.page, "Q & A page"),
  ...SPECS.map(([id, pageLabel, sectionLabel, fieldLabel, , type]) => ({
    id,
    pageLabel,
    sectionLabel,
    fieldLabel,
    type: type ?? "text",
  })),
];

export const SS_PAGES_CMS_DEFAULTS: Record<string, string> = {
  ...Object.assign({}, ...META.map(([key, , title, description]) => pageMetaDefaults(key, { title, description }))),
  ...pageMetaDefaults(Q_AND_A_META.key, Q_AND_A_META),
  ...Object.fromEntries(SPECS.map(([id, , , , def]) => [id, def])),
};

/** Ids of every field above (for one `getContentMany` call per page). */
export function ssPageFieldIds(prefix: string): string[] {
  return SS_PAGES_CMS_REGISTRY.map((f) => f.id).filter((id) => id.startsWith(prefix));
}
