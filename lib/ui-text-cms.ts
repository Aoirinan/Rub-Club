import type { ContentFieldMeta } from "@/lib/cms-registry";
import { OFFICE_INFO_CMS_DEFAULTS, OFFICE_INFO_CMS_REGISTRY } from "@/lib/office-info-cms";
import { SITE_META_CMS_DEFAULTS, SITE_META_CMS_REGISTRY } from "@/lib/site-meta-cms";

/**
 * Site-wide button labels and short chrome strings that appear on many pages
 * (header, footer, CTA cards, location blocks, call-to-book popup). One field
 * each, edited under Home → "Site text (buttons & labels)". Every default is
 * the exact text the site showed before these became editable.
 */
export const UI_TEXT_DEFAULTS = {
  // Buttons
  ui_book_now: "Book Now",
  ui_call_prefix: "Call",
  ui_call_us: "Call Us",
  ui_get_directions: "Get directions",
  ui_get_directions_hero: "Get Directions",
  ui_read_more: "Read More",
  ui_learn_more: "Learn more",
  ui_close: "Close",
  ui_details_hours: "Details & hours",
  ui_book_at_location: "Book at this location",
  ui_leave_google_review: "Leave a Google review",
  ui_review_prefix: "Review",
  ui_appointments: "Appointments",
  ui_schedule_an_appointment: "Schedule an Appointment",
  ui_schedule_appointment_cta: "Schedule an appointment",

  // Hero / contact strips
  ui_call_or_text_today: "Call or Text Us Today:",
  ui_call_or_text: "Call or Text Us:",
  ui_office_label: "Office:",
  ui_massage_desk_label: "Massage desk:",
  ui_fax_label: "Fax:",
  ui_visit_us: "Visit us",

  // Hours
  ui_hours: "Hours",
  ui_office_hours: "Office Hours",
  ui_office_hours_lower: "Office hours",
  ui_our_general_schedule: "Our General Schedule",
  ui_hours_col_chiro: "Chiro",
  ui_hours_col_massage: "Massage",
  ui_hours_empty: "—",
  ui_hours_word: "hours",
  ui_hours_word_cap: "Hours",

  // Footer
  ui_explore: "Explore",
  ui_all_practices: "All practices →",
  ui_gift_cards_square: "Gift cards (Square)",
  ui_privacy_practices: "Privacy practices",
  ui_website_privacy: "Website privacy",
  ui_terms: "Terms",
  ui_staff_link: "Staff",

  // Team / reviews / FAQ
  ui_meet_the_team: "Meet the team",
  ui_video: "Video",
  ui_adjustment_in_action: "Adjustment in action",
  ui_meet_doctor_prefix: "Meet Dr.",
  ui_meet_prefix: "Meet",
  ui_what_patients_say: "What our patients say",
  ui_video_testimonials_sub: "Video testimonials from real visits.",
  ui_read_more_reviews: "Read more reviews",
  ui_faq_heading: "Frequently asked questions",
  ui_see_all_faqs: "See all FAQs",
  ui_what_clients_say: "What clients say",
  ui_adjustments_heading: "Adjustments in Action",
  ui_adjustments_line_none: "Our Paris chiropractors at work.",
  ui_adjustments_line_suffix: "at work in our Paris office.",
  ui_adjustment_by_prefix: "Adjustment by",

  // Call-to-book popup (every Book Now button)
  ui_booking_modal_title: "Call to book your visit",
  ui_booking_modal_body: "Give us a call and our front desk will find a time that works for you.",
  ui_booking_modal_name_paris_chiro: "Chiropractic Associates — Paris",
  ui_booking_modal_name_paris_massage: "The Rub Club Massage — Paris",
  ui_booking_modal_name_ss: "Chiropractic Associates of Sulphur Springs",
  ui_scheduling_soon_tooltip: "Online scheduling opens soon — please call the office.",

  // Mobile sticky bar / accessibility
  ui_sticky_call: "Call Us",
  ui_sticky_book: "Book Now",

  // Online forms footer
  ui_form_office_paris_name: "Chiropractic Associates",
  ui_form_office_ss_name: "Chiropractic Associates of Sulphur Springs",
  ui_form_office_rubclub_name: "The Rub Club",
  ui_form_secure_note:
    "Your information is sent securely to our office and is only viewable by our staff.",
} as const;

export type UiTextKey = keyof typeof UI_TEXT_DEFAULTS;
export type UiText = Record<UiTextKey, string>;

const SECTION_OF: Record<UiTextKey, string> = {
  ui_book_now: "Buttons",
  ui_call_prefix: "Buttons",
  ui_call_us: "Buttons",
  ui_get_directions: "Buttons",
  ui_get_directions_hero: "Buttons",
  ui_read_more: "Buttons",
  ui_learn_more: "Buttons",
  ui_close: "Buttons",
  ui_details_hours: "Buttons",
  ui_book_at_location: "Buttons",
  ui_leave_google_review: "Buttons",
  ui_review_prefix: "Buttons",
  ui_appointments: "Buttons",
  ui_schedule_an_appointment: "Buttons",
  ui_schedule_appointment_cta: "Buttons",
  ui_call_or_text_today: "Contact labels",
  ui_call_or_text: "Contact labels",
  ui_office_label: "Contact labels",
  ui_massage_desk_label: "Contact labels",
  ui_fax_label: "Contact labels",
  ui_visit_us: "Contact labels",
  ui_hours: "Hours",
  ui_office_hours: "Hours",
  ui_office_hours_lower: "Hours",
  ui_our_general_schedule: "Hours",
  ui_hours_col_chiro: "Hours",
  ui_hours_col_massage: "Hours",
  ui_hours_empty: "Hours",
  ui_hours_word: "Hours",
  ui_hours_word_cap: "Hours",
  ui_explore: "Footer",
  ui_all_practices: "Footer",
  ui_gift_cards_square: "Footer",
  ui_privacy_practices: "Footer",
  ui_website_privacy: "Footer",
  ui_terms: "Footer",
  ui_staff_link: "Footer",
  ui_meet_the_team: "Team, reviews & FAQ",
  ui_video: "Team, reviews & FAQ",
  ui_adjustment_in_action: "Team, reviews & FAQ",
  ui_meet_doctor_prefix: "Team, reviews & FAQ",
  ui_meet_prefix: "Team, reviews & FAQ",
  ui_what_patients_say: "Team, reviews & FAQ",
  ui_video_testimonials_sub: "Team, reviews & FAQ",
  ui_read_more_reviews: "Team, reviews & FAQ",
  ui_faq_heading: "Team, reviews & FAQ",
  ui_see_all_faqs: "Team, reviews & FAQ",
  ui_what_clients_say: "Team, reviews & FAQ",
  ui_adjustments_heading: "Adjustments in Action",
  ui_adjustments_line_none: "Adjustments in Action",
  ui_adjustments_line_suffix: "Adjustments in Action",
  ui_adjustment_by_prefix: "Adjustments in Action",
  ui_booking_modal_title: "Call-to-book popup",
  ui_booking_modal_body: "Call-to-book popup",
  ui_booking_modal_name_paris_chiro: "Call-to-book popup",
  ui_booking_modal_name_paris_massage: "Call-to-book popup",
  ui_booking_modal_name_ss: "Call-to-book popup",
  ui_scheduling_soon_tooltip: "Call-to-book popup",
  ui_sticky_call: "Mobile sticky bar",
  ui_sticky_book: "Mobile sticky bar",
  ui_form_office_paris_name: "Online forms footer",
  ui_form_office_ss_name: "Online forms footer",
  ui_form_office_rubclub_name: "Online forms footer",
  ui_form_secure_note: "Online forms footer",
};

const LABEL_OF: Partial<Record<UiTextKey, string>> = {
  ui_call_prefix: "“Call” button prefix (followed by the phone number)",
  ui_review_prefix: "“Review” button prefix (followed by the office name)",
  ui_meet_doctor_prefix: "“Meet Dr.” video label prefix (followed by first name)",
  ui_meet_prefix: "“Meet” video label prefix for non-doctors",
  ui_hours_empty: "Placeholder when a day has no hours",
  ui_get_directions_hero: "Get Directions (home page hero, mobile)",
  ui_office_hours_lower: "Office hours (location page heading)",
  ui_schedule_appointment_cta: "Schedule an appointment (service page CTA heading)",
  ui_schedule_an_appointment: "Schedule an Appointment (hero fallback)",
  ui_sticky_call: "Call button",
  ui_sticky_book: "Book button",
  ui_hours_word: "“hours” suffix after a business name (e.g. The Rub Club hours)",
  ui_hours_word_cap: "“Hours” suffix on the home page location block",
  ui_adjustments_line_none: "Caption when no doctor is shown",
  ui_adjustments_line_suffix: "Caption after the doctor names (“Dr. X and Dr. Y …”)",
  ui_adjustment_by_prefix: "“Adjustment by” photo caption prefix",
  ui_form_secure_note: "Privacy note under the online forms",
};

function labelFor(key: UiTextKey): string {
  if (LABEL_OF[key]) return LABEL_OF[key]!;
  return key.replace(/^ui_/, "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export const UI_TEXT_KEYS = Object.keys(UI_TEXT_DEFAULTS) as UiTextKey[];

/** Site-wide button labels and short chrome strings shared by many pages. */
export const UI_TEXT_CMS_REGISTRY: ContentFieldMeta[] = [
  ...UI_TEXT_KEYS.map(
    (id): ContentFieldMeta => ({
      id,
      pageLabel: "Site text",
      sectionLabel: SECTION_OF[id],
      fieldLabel: labelFor(id),
      type: "text",
    }),
  ),
  // Office identity + site-wide search/social fields ride along so they reach
  // the registry without touching lib/cms-registry.ts.
  ...OFFICE_INFO_CMS_REGISTRY,
  ...SITE_META_CMS_REGISTRY,
];

export const UI_TEXT_CMS_DEFAULTS: Record<string, string> = {
  ...UI_TEXT_DEFAULTS,
  ...OFFICE_INFO_CMS_DEFAULTS,
  ...SITE_META_CMS_DEFAULTS,
};

/** Merge CMS values over the defaults (blank CMS values fall back). */
export function resolveUiText(cms: Partial<Record<string, string>>): UiText {
  const out = { ...UI_TEXT_DEFAULTS } as UiText;
  for (const key of UI_TEXT_KEYS) {
    const v = cms[key]?.trim();
    if (v) out[key] = v;
  }
  return out;
}
