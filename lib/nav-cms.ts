import type { ContentFieldMeta } from "@/lib/cms-registry";
import { FACEBOOK_URL, INSTAGRAM_URL } from "@/lib/constants";

/**
 * Header navigation labels, submenu group headings, contact dropdown labels,
 * phone-bar prefixes, mobile-menu labels and social links. Edited under
 * Home → "Menu & navigation". Every default is the exact text the header showed
 * before these became editable. (The About Us label stays on the older
 * `nav_staff_label` field; per-service menu labels live with each service page.)
 */
export const NAV_TEXT_DEFAULTS = {
  // Top menu
  nav_home_label: "Home",
  nav_services_label: "Services",
  nav_chiropractic_label: "Chiropractic",
  nav_massage_label: "Massage",
  nav_wellness_label: "Wellness Plan",
  nav_giftcards_label: "Gift cards",
  nav_patient_forms_label: "Patient Forms",
  nav_contact_label: "Contact Us",
  nav_child_paris_label: "Paris",
  nav_child_sulphur_label: "Sulphur Springs",
  nav_wellness_child_plan_label: "Wellness Plan",
  nav_wellness_child_prices_label: "Massage Prices",
  nav_overview_label: "Overview →",

  // Services menu groups
  nav_group_injuries: "Injuries",
  nav_group_therapeutic_massage: "Therapeutic Massage",
  nav_group_cryotherapy: "Cryotherapy",
  nav_group_electrical_stimulation: "Electrical Stimulation",
  nav_group_chiropractic_services: "Chiropractic Services",
  nav_ss_massage_therapy_label: "Massage Therapy",

  // Contact dropdown
  nav_contact_paris_name: "Paris (main office)",
  nav_contact_sulphur_name: "Sulphur Springs (second location)",
  nav_contact_office_label: "Office",
  nav_contact_massage_desk_label: "Massage desk",

  // Phone bar
  nav_phone_bar_paris_chiro_prefix: "Paris Chiropractic",
  nav_phone_bar_sulphur_prefix: "Sulphur Springs",
  nav_phone_bar_paris_prefix: "Paris",
  nav_phone_bar_rub_prefix: "The Rub Club:",

  // Mobile menu
  nav_mobile_menu_label: "Menu",
  nav_mobile_call_us_label: "Call us",
  nav_mobile_paris_prefix: "Paris",
  nav_mobile_rub_prefix: "The Rub Club",
  nav_mobile_sulphur_prefix: "Sulphur Springs",
  nav_mobile_facebook_label: "Facebook",
  nav_mobile_instagram_label: "Instagram",
  nav_mobile_staff_sign_in_label: "Staff sign-in",

  // Social links
  social_facebook_url: FACEBOOK_URL,
  social_instagram_url: INSTAGRAM_URL,
} as const;

export type NavTextKey = keyof typeof NAV_TEXT_DEFAULTS;
export type NavText = Record<NavTextKey, string>;

export const NAV_TEXT_KEYS = Object.keys(NAV_TEXT_DEFAULTS) as NavTextKey[];

const SECTION_OF: Record<NavTextKey, string> = {
  nav_home_label: "Top menu",
  nav_services_label: "Top menu",
  nav_chiropractic_label: "Top menu",
  nav_massage_label: "Top menu",
  nav_wellness_label: "Top menu",
  nav_giftcards_label: "Top menu",
  nav_patient_forms_label: "Top menu",
  nav_contact_label: "Top menu",
  nav_child_paris_label: "Top menu",
  nav_child_sulphur_label: "Top menu",
  nav_wellness_child_plan_label: "Top menu",
  nav_wellness_child_prices_label: "Top menu",
  nav_overview_label: "Top menu",
  nav_group_injuries: "Services menu groups",
  nav_group_therapeutic_massage: "Services menu groups",
  nav_group_cryotherapy: "Services menu groups",
  nav_group_electrical_stimulation: "Services menu groups",
  nav_group_chiropractic_services: "Services menu groups",
  nav_ss_massage_therapy_label: "Services menu groups",
  nav_contact_paris_name: "Contact dropdown",
  nav_contact_sulphur_name: "Contact dropdown",
  nav_contact_office_label: "Contact dropdown",
  nav_contact_massage_desk_label: "Contact dropdown",
  nav_phone_bar_paris_chiro_prefix: "Phone bar",
  nav_phone_bar_sulphur_prefix: "Phone bar",
  nav_phone_bar_paris_prefix: "Phone bar",
  nav_phone_bar_rub_prefix: "Phone bar",
  nav_mobile_menu_label: "Mobile menu",
  nav_mobile_call_us_label: "Mobile menu",
  nav_mobile_paris_prefix: "Mobile menu",
  nav_mobile_rub_prefix: "Mobile menu",
  nav_mobile_sulphur_prefix: "Mobile menu",
  nav_mobile_facebook_label: "Mobile menu",
  nav_mobile_instagram_label: "Mobile menu",
  nav_mobile_staff_sign_in_label: "Mobile menu",
  social_facebook_url: "Social links",
  social_instagram_url: "Social links",
};

const LABEL_OF: Record<NavTextKey, string> = {
  nav_home_label: "Home",
  nav_services_label: "Services",
  nav_chiropractic_label: "Chiropractic",
  nav_massage_label: "Massage",
  nav_wellness_label: "Wellness Plan",
  nav_giftcards_label: "Gift cards",
  nav_patient_forms_label: "Patient Forms",
  nav_contact_label: "Contact Us",
  nav_child_paris_label: "Submenu item: Paris (under Chiropractic, Massage, About Us)",
  nav_child_sulphur_label: "Submenu item: Sulphur Springs (under Chiropractic, Massage, About Us)",
  nav_wellness_child_plan_label: "Wellness Plan submenu: first item",
  nav_wellness_child_prices_label: "Wellness Plan submenu: prices item",
  nav_overview_label: "Services menu: overview link",
  nav_group_injuries: "Group heading: Injuries",
  nav_group_therapeutic_massage: "Group heading: Therapeutic Massage",
  nav_group_cryotherapy: "Group heading: Cryotherapy",
  nav_group_electrical_stimulation: "Group heading: Electrical Stimulation",
  nav_group_chiropractic_services: "Group heading: Chiropractic Services",
  nav_ss_massage_therapy_label: "Sulphur Springs menu: massage page item",
  nav_contact_paris_name: "Paris clinic name",
  nav_contact_sulphur_name: "Sulphur Springs clinic name",
  nav_contact_office_label: "Office phone label",
  nav_contact_massage_desk_label: "Massage desk phone label",
  nav_phone_bar_paris_chiro_prefix: "Paris chiropractic pages: text before the phone number",
  nav_phone_bar_sulphur_prefix: "Sulphur Springs: text before the phone number",
  nav_phone_bar_paris_prefix: "Paris: text before the phone number",
  nav_phone_bar_rub_prefix: "The Rub Club: text before the phone number",
  nav_mobile_menu_label: "Menu button / drawer title",
  nav_mobile_call_us_label: "Call us heading",
  nav_mobile_paris_prefix: "Paris: text before the phone number",
  nav_mobile_rub_prefix: "The Rub Club: text before the phone number",
  nav_mobile_sulphur_prefix: "Sulphur Springs: text before the phone number",
  nav_mobile_facebook_label: "Facebook link label",
  nav_mobile_instagram_label: "Instagram link label",
  nav_mobile_staff_sign_in_label: "Staff sign-in link label",
  social_facebook_url: "Facebook page URL",
  social_instagram_url: "Instagram page URL",
};

/**
 * Opt-in switch for the uploaded Paris header logo. Off by default: the header
 * keeps the icon + text lockup even when a logo image has been uploaded, so a
 * stored upload never changes the header until a manager turns this on.
 */
export const HEADER_CHIRO_LOGO_ENABLED_FIELD = "header_chiro_logo_enabled";

/** Header navigation labels, submenu headings, contact dropdown labels, social links. */
export const NAV_CMS_REGISTRY: ContentFieldMeta[] = [
  ...NAV_TEXT_KEYS.map(
    (id): ContentFieldMeta => ({
      id,
      pageLabel: "Navigation",
      sectionLabel: SECTION_OF[id],
      fieldLabel: LABEL_OF[id],
      type: id.endsWith("_url") ? "url" : "text",
    }),
  ),
  {
    id: HEADER_CHIRO_LOGO_ENABLED_FIELD,
    pageLabel: "Paris header & footer",
    sectionLabel: "Header",
    fieldLabel: "Show the uploaded logo instead of the icon + text lockup",
    type: "boolean",
  },
];

export const NAV_CMS_DEFAULTS: Record<string, string> = {
  ...NAV_TEXT_DEFAULTS,
  [HEADER_CHIRO_LOGO_ENABLED_FIELD]: "false",
};

/** Merge CMS values over the defaults (blank CMS values fall back). */
export function resolveNavText(cms: Partial<Record<string, string>>): NavText {
  const out = { ...NAV_TEXT_DEFAULTS } as NavText;
  for (const key of NAV_TEXT_KEYS) {
    const v = cms[key]?.trim();
    if (v) out[key] = v;
  }
  return out;
}
