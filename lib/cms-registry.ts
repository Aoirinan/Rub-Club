import { GIFT_CARD_ORDER_URL, LOCATIONS } from "@/lib/constants";
import { IMAGES } from "@/lib/home-images";
import {
  CHIRO,
  DOCTORS,
  HOME_INTRO,
  MASSAGE,
} from "@/lib/home-verbatim";
export const PARIS_HOURS_DEFAULT_TEXT = MASSAGE.hours.map((r) => `${r.day}|${r.hours}`).join("\n");
import { siteShortName } from "@/lib/site-content";
import {
  WELLNESS_SECTION_SPECS,
  wellnessCarePlansDefaults,
  wellnessSectionFieldId,
} from "@/lib/wellness-care-plans-content";
import {
  buildParisStaffCmsDefaults,
  buildParisStaffCmsRegistry,
} from "@/lib/paris-staff-cms-registry";
import { buildSSCmsDefaults, buildSSCmsRegistry } from "@/lib/ss-cms-registry";
import { buildSSStaffCmsDefaults, buildSSStaffCmsRegistry } from "@/lib/ss-staff-cms-registry";
import {
  buildHeaderBrandingCmsDefaults,
  buildHeaderBrandingCmsRegistry,
} from "@/lib/header-branding-cms";
import {
  STATIC_PAGES_CMS_REGISTRY,
  buildStaticPagesCmsDefaults,
} from "@/lib/static-pages-cms";

export type ContentFieldType =
  | "text"
  | "richtext"
  | "image"
  | "video"
  | "phone"
  | "url";

export type ContentPageKey =
  | "Home"
  | "Chiropractic"
  | "Massage"
  | "Paris / main office"
  | "Paris staff"
  | "Sulphur Springs"
  | "Sulphur staff"
  | "SS subpages"
  | "Insurance"
  | "Services hub"
  | "Reviews"
  | "Patient forms"
  | "About"
  | "FAQ"
  | "Contact"
  | "Footer"
  | "Navigation"
  | "Header branding"
  | "Doctors"
  | "Wellness care plans";

export type ContentFieldMeta = {
  id: string;
  pageLabel: ContentPageKey;
  sectionLabel: string;
  fieldLabel: string;
  type: ContentFieldType;
};

const CHIRO_TESTIMONIAL_DEFAULTS = [
  {
    text: "After a car accident I could barely turn my head. A few weeks with Dr. Welborn plus deep-tissue work from The Rub Club and I was back to normal.",
    attr: "Sulphur Springs patient Â· Auto injury recovery",
  },
  {
    text: "Dr. Thompson and the team have kept me moving for years. I always leave feeling looked after â€” and they never push extra visits I do not need.",
    attr: "Long-time Paris patient Â· Chiropractic",
  },
  {
    text: "I had sciatica so bad I couldn't sit through a workday. Dr. Brandy Collins found the problem fast and had me feeling better within two weeks.",
    attr: "Paris patient Â· Sciatica",
  },
] as const;

const MASSAGE_SERVICES_DEFAULT = `Deep Tissue Massage â€” Slow, targeted pressure to release chronic tension in the neck, shoulders, lower back, and hips.

Prenatal Massage â€” Side-lying, pregnancy-safe positioning with techniques to ease swelling, hip pressure, and tension headaches.

Sports Massage â€” Pre- and post-event work focused on recovery, range of motion, and getting you back to training without rushing tissue.

Trigger Point & Lymphatic â€” Focused release of stubborn knots, plus gentle lymphatic drainage when appropriate.

Therapeutic Massage â€” Coordinated with your chiropractic plan â€” designed to support recovery between adjustments.`;

const SS_HOURS_DEFAULT = `Monday â€“ Friday: 9:00 AM â€“ 5:00 PM
Saturday â€“ Sunday: Closed`;

const paris = LOCATIONS.paris;
const ss = LOCATIONS.sulphur_springs;

export const CONTENT_REGISTRY: ContentFieldMeta[] = [
  { id: "home_hero_heading", pageLabel: "Home", sectionLabel: "Hero", fieldLabel: "Main Heading", type: "text" },
  { id: "home_hero_subheading", pageLabel: "Home", sectionLabel: "Hero", fieldLabel: "Subheading", type: "text" },
  { id: "home_hero_cta_label", pageLabel: "Home", sectionLabel: "Hero", fieldLabel: "Button Label", type: "text" },
  { id: "home_awards_text", pageLabel: "Home", sectionLabel: "Awards Strip", fieldLabel: "Awards Text", type: "text" },
  { id: "home_about_blurb", pageLabel: "Home", sectionLabel: "About Section", fieldLabel: "Body Copy", type: "richtext" },
  { id: "home_testimonials_heading", pageLabel: "Home", sectionLabel: "Testimonials", fieldLabel: "Section Heading", type: "text" },

  { id: "chiro_hero_heading", pageLabel: "Chiropractic", sectionLabel: "Hero", fieldLabel: "Main Heading", type: "text" },
  { id: "chiro_hero_subheading", pageLabel: "Chiropractic", sectionLabel: "Hero", fieldLabel: "Subheading", type: "text" },
  { id: "chiro_intro_body", pageLabel: "Chiropractic", sectionLabel: "Intro", fieldLabel: "Body Copy", type: "richtext" },
  { id: "chiro_conditions_list", pageLabel: "Chiropractic", sectionLabel: "Conditions", fieldLabel: "Conditions (comma-separated)", type: "text" },
  { id: "chiro_cta_heading", pageLabel: "Chiropractic", sectionLabel: "CTA", fieldLabel: "Heading", type: "text" },
  { id: "chiro_cta_subtext", pageLabel: "Chiropractic", sectionLabel: "CTA", fieldLabel: "Subtext", type: "text" },
  { id: "chiro_testimonial_1_text", pageLabel: "Chiropractic", sectionLabel: "Testimonials", fieldLabel: "Testimonial 1", type: "richtext" },
  { id: "chiro_testimonial_1_attr", pageLabel: "Chiropractic", sectionLabel: "Testimonials", fieldLabel: "Testimonial 1 Attribution", type: "text" },
  { id: "chiro_testimonial_2_text", pageLabel: "Chiropractic", sectionLabel: "Testimonials", fieldLabel: "Testimonial 2", type: "richtext" },
  { id: "chiro_testimonial_2_attr", pageLabel: "Chiropractic", sectionLabel: "Testimonials", fieldLabel: "Testimonial 2 Attribution", type: "text" },
  { id: "chiro_testimonial_3_text", pageLabel: "Chiropractic", sectionLabel: "Testimonials", fieldLabel: "Testimonial 3", type: "richtext" },
  { id: "chiro_testimonial_3_attr", pageLabel: "Chiropractic", sectionLabel: "Testimonials", fieldLabel: "Testimonial 3 Attribution", type: "text" },

  { id: "doctor_greg_name", pageLabel: "Doctors", sectionLabel: "Dr. Greg Thompson", fieldLabel: "Name", type: "text" },
  { id: "doctor_greg_role", pageLabel: "Doctors", sectionLabel: "Dr. Greg Thompson", fieldLabel: "Job title", type: "text" },
  { id: "doctor_greg_bio", pageLabel: "Doctors", sectionLabel: "Dr. Greg Thompson", fieldLabel: "Bio", type: "richtext" },
  { id: "doctor_greg_photo", pageLabel: "Doctors", sectionLabel: "Dr. Greg Thompson", fieldLabel: "Photo", type: "image" },
  { id: "doctor_greg_video", pageLabel: "Doctors", sectionLabel: "Dr. Greg Thompson", fieldLabel: "Intro video", type: "video" },
  { id: "doctor_sean_name", pageLabel: "Doctors", sectionLabel: "Dr. Sean Welborn", fieldLabel: "Name", type: "text" },
  { id: "doctor_sean_role", pageLabel: "Doctors", sectionLabel: "Dr. Sean Welborn", fieldLabel: "Job title", type: "text" },
  { id: "doctor_sean_bio", pageLabel: "Doctors", sectionLabel: "Dr. Sean Welborn", fieldLabel: "Bio", type: "richtext" },
  { id: "doctor_sean_photo", pageLabel: "Doctors", sectionLabel: "Dr. Sean Welborn", fieldLabel: "Photo", type: "image" },
  { id: "doctor_sean_video", pageLabel: "Doctors", sectionLabel: "Dr. Sean Welborn", fieldLabel: "Intro video", type: "video" },
  { id: "doctor_brandy_name", pageLabel: "Doctors", sectionLabel: "Dr. Brandy Collins", fieldLabel: "Name", type: "text" },
  { id: "doctor_brandy_role", pageLabel: "Doctors", sectionLabel: "Dr. Brandy Collins", fieldLabel: "Job title", type: "text" },
  { id: "doctor_brandy_bio", pageLabel: "Doctors", sectionLabel: "Dr. Brandy Collins", fieldLabel: "Bio", type: "richtext" },
  { id: "doctor_brandy_photo", pageLabel: "Doctors", sectionLabel: "Dr. Brandy Collins", fieldLabel: "Photo", type: "image" },
  { id: "doctor_brandy_video", pageLabel: "Doctors", sectionLabel: "Dr. Brandy Collins", fieldLabel: "Intro video", type: "video" },

  { id: "massage_hero_heading", pageLabel: "Massage", sectionLabel: "Hero", fieldLabel: "Main Heading", type: "text" },
  { id: "massage_hero_subheading", pageLabel: "Massage", sectionLabel: "Hero", fieldLabel: "Subheading", type: "text" },
  { id: "massage_intro_body", pageLabel: "Massage", sectionLabel: "Intro", fieldLabel: "Body Copy", type: "richtext" },
  { id: "massage_services_list", pageLabel: "Massage", sectionLabel: "Services", fieldLabel: "Services Offered", type: "richtext" },
  { id: "massage_cta_heading", pageLabel: "Massage", sectionLabel: "CTA", fieldLabel: "Heading", type: "text" },

  {
    id: "paris_hours",
    pageLabel: "Paris / main office",
    sectionLabel: "Hours",
    fieldLabel: "Office hours (one line per day: Monday|9:00 AM â€“ 5:00 PM)",
    type: "richtext",
  },

  { id: "ss_hero_heading", pageLabel: "Sulphur Springs", sectionLabel: "Hero", fieldLabel: "Main Heading", type: "text" },
  { id: "ss_intro_body", pageLabel: "Sulphur Springs", sectionLabel: "Intro", fieldLabel: "Body Copy", type: "richtext" },
  {
    id: "ss_hours",
    pageLabel: "Sulphur Springs",
    sectionLabel: "Location",
    fieldLabel: "Hours (one line per range: Monday â€“ Friday|9:00 AM â€“ 5:00 PM)",
    type: "richtext",
  },

  { id: "about_heading", pageLabel: "About", sectionLabel: "Hero", fieldLabel: "Main Heading", type: "text" },
  { id: "about_body", pageLabel: "About", sectionLabel: "Story", fieldLabel: "Body Copy", type: "richtext" },

  { id: "faq_heading", pageLabel: "FAQ", sectionLabel: "Hero", fieldLabel: "Main Heading", type: "text" },
  { id: "faq_intro", pageLabel: "FAQ", sectionLabel: "Intro", fieldLabel: "Intro Text", type: "text" },

  { id: "contact_heading", pageLabel: "Contact", sectionLabel: "Hero", fieldLabel: "Heading", type: "text" },
  { id: "contact_subtext", pageLabel: "Contact", sectionLabel: "Hero", fieldLabel: "Subtext", type: "text" },

  {
    id: "header_show_top_phone_bar",
    pageLabel: "Footer",
    sectionLabel: "Header",
    fieldLabel: "Show dark phone bar above logos",
    type: "text",
  },
  { id: "footer_tagline", pageLabel: "Footer", sectionLabel: "Footer", fieldLabel: "Tagline", type: "text" },
  { id: "footer_paris_address", pageLabel: "Footer", sectionLabel: "Paris", fieldLabel: "Address", type: "text" },
  { id: "footer_paris_phone", pageLabel: "Footer", sectionLabel: "Paris", fieldLabel: "Phone", type: "phone" },
  { id: "footer_massage_phone", pageLabel: "Footer", sectionLabel: "Paris", fieldLabel: "Massage Desk Phone", type: "phone" },
  { id: "footer_ss_address", pageLabel: "Footer", sectionLabel: "Sulphur Springs", fieldLabel: "Address", type: "text" },
  { id: "footer_ss_phone", pageLabel: "Footer", sectionLabel: "Sulphur Springs", fieldLabel: "Phone", type: "phone" },
  { id: "footer_copyright", pageLabel: "Footer", sectionLabel: "Footer", fieldLabel: "Copyright Text", type: "text" },

  { id: "nav_giftcard_url", pageLabel: "Navigation", sectionLabel: "Links", fieldLabel: "Gift Card URL", type: "url" },
  { id: "nav_book_url", pageLabel: "Navigation", sectionLabel: "Links", fieldLabel: "Book Now URL", type: "url" },

  { id: "chiro_wellness_teaser_heading", pageLabel: "Chiropractic", sectionLabel: "Wellness teaser", fieldLabel: "Heading", type: "text" },
  { id: "chiro_wellness_teaser_body", pageLabel: "Chiropractic", sectionLabel: "Wellness teaser", fieldLabel: "Body copy", type: "text" },

  { id: "wellness_hero_eyebrow", pageLabel: "Wellness care plans", sectionLabel: "Hero", fieldLabel: "Eyebrow", type: "text" },
  { id: "wellness_page_lede", pageLabel: "Wellness care plans", sectionLabel: "Hero", fieldLabel: "Intro paragraph", type: "text" },
  ...WELLNESS_SECTION_SPECS.flatMap((spec) => [
    {
      id: wellnessSectionFieldId(spec.id, "title"),
      pageLabel: "Wellness care plans" as const,
      sectionLabel: spec.title,
      fieldLabel: "Section title",
      type: "text" as const,
    },
    {
      id: wellnessSectionFieldId(spec.id, "subtitle"),
      pageLabel: "Wellness care plans" as const,
      sectionLabel: spec.title,
      fieldLabel: "Subtitle (optional)",
      type: "text" as const,
    },
    {
      id: wellnessSectionFieldId(spec.id, "lines"),
      pageLabel: "Wellness care plans" as const,
      sectionLabel: spec.title,
      fieldLabel: "Plan lines (one per line)",
      type: "richtext" as const,
    },
  ]),
  {
    id: "wellness_closing_headline",
    pageLabel: "Wellness care plans",
    sectionLabel: "Closing",
    fieldLabel: "Headline",
    type: "text",
  },
  {
    id: "wellness_closing_lines",
    pageLabel: "Wellness care plans",
    sectionLabel: "Closing",
    fieldLabel: "Bullet points (one per line)",
    type: "richtext",
  },
  {
    id: "wellness_cta_title",
    pageLabel: "Wellness care plans",
    sectionLabel: "Bottom CTA",
    fieldLabel: "Heading",
    type: "text",
  },
  {
    id: "wellness_cta_body",
    pageLabel: "Wellness care plans",
    sectionLabel: "Bottom CTA",
    fieldLabel: "Body copy",
    type: "text",
  },

  ...buildSSCmsRegistry(),
  ...buildParisStaffCmsRegistry(),
  ...buildSSStaffCmsRegistry(),
  ...buildHeaderBrandingCmsRegistry(),
  ...STATIC_PAGES_CMS_REGISTRY,
];

export const DEFAULTS: Record<string, string> = {
  home_hero_heading: "Massage Therapy & Chiropractic Care in Paris & Sulphur Springs, TX",
  home_hero_subheading: CHIRO.spineSub,
  home_hero_cta_label: "Book Online",
  home_awards_text:
    "Voted Best Chiropractic Center & Best Massage â€” The Paris News reader polls.",
  home_about_blurb: HOME_INTRO.body,
  home_testimonials_heading: "What our patients say",

  chiro_hero_heading: "Efficient, evidence-informed chiropractic care",
  chiro_hero_subheading:
    "Dr. Greg Thompson, Dr. Sean Welborn, and Dr. Brandy Collins serve patients across Northeast Texas from Paris and Sulphur Springs.",
  chiro_intro_body: `${CHIRO.chooseLead}\n\n${CHIRO.chooseP2}\n\n${CHIRO.chooseP3}`,
  chiro_conditions_list: CHIRO.conditions.join(", "),
  chiro_cta_heading: CHIRO.contactUsTitle,
  chiro_cta_subtext: CHIRO.bookCta,
  chiro_testimonial_1_text: CHIRO_TESTIMONIAL_DEFAULTS[0].text,
  chiro_testimonial_1_attr: CHIRO_TESTIMONIAL_DEFAULTS[0].attr,
  chiro_testimonial_2_text: CHIRO_TESTIMONIAL_DEFAULTS[1].text,
  chiro_testimonial_2_attr: CHIRO_TESTIMONIAL_DEFAULTS[1].attr,
  chiro_testimonial_3_text: CHIRO_TESTIMONIAL_DEFAULTS[2].text,
  chiro_testimonial_3_attr: CHIRO_TESTIMONIAL_DEFAULTS[2].attr,

  doctor_greg_name: DOCTORS[0].name,
  doctor_greg_role: DOCTORS[0].role,
  doctor_greg_bio: DOCTORS[0].bio,
  doctor_greg_photo: IMAGES.doctorGreg,
  doctor_greg_video: "",
  doctor_sean_name: DOCTORS[1].name,
  doctor_sean_role: DOCTORS[1].role,
  doctor_sean_bio: DOCTORS[1].bio,
  doctor_sean_photo: IMAGES.doctorSean,
  doctor_sean_video: "",
  doctor_brandy_name: DOCTORS[2].name,
  doctor_brandy_role: DOCTORS[2].role,
  doctor_brandy_bio: DOCTORS[2].bio,
  doctor_brandy_photo: IMAGES.doctorCollins,
  doctor_brandy_video: "",

  massage_hero_heading: "Therapeutic massage that meets you where you are",
  massage_hero_subheading:
    "Licensed therapists. Honest treatment plans. Coordinated with chiropractic care when it helps. Call 903-739-9959 or book online below.",
  massage_intro_body: MASSAGE.stressParas.join("\n\n"),
  massage_services_list: MASSAGE_SERVICES_DEFAULT,
  massage_cta_heading: MASSAGE.contactTitle,

  paris_hours: PARIS_HOURS_DEFAULT_TEXT,

  ss_hero_heading: "Chiropractic Care Created Precisely For You",
  ss_intro_body:
    "Welcome to our practice! We hope that you will find this website helpful in learning more about our office, our chiropractic care, and how chiropractic care can improve your quality of life.\n\nWe understand that although our patients may be diagnosed with the same condition, they may respond differently to treatments. For this reason, we tailor a specific plan of action to meet your needs, goals and unique condition.",
  ss_hours: SS_HOURS_DEFAULT,

  about_heading: "About our practice",
  about_body: `Chiropractic Associates was founded in Paris, TX in 1998 by Dr. Greg Thompson. As the practice grew, Dr. Thompson opened The Rub Club so that licensed massage therapists could coordinate care directly with the chiropractic team â€” same building, same schedule, same standards.

Today we serve Northeast Texas and Southeast Oklahoma from our main Paris office and a second chiropractic location in Sulphur Springs. Our doctors and therapists share charts and timelines so your massage and adjustment work together, not against each other.`,

  faq_heading: "Frequently asked questions",
  faq_intro:
    "Insurance, scheduling, pricing, and first-visit answers. Can't find your question? Send us a message and we'll help.",

  contact_heading: "Contact us",
  contact_subtext:
    "Call the office that's most convenient, or send us a message and we will follow up during office hours.",

  header_show_top_phone_bar: "true",

  footer_tagline:
    "Family-owned wellness in Northeast Texas. Two practices, one address in Paris â€” plus chiropractic care in Sulphur Springs.",
  footer_paris_address: `${paris.streetAddress}, ${paris.addressLocality}, ${paris.addressRegion} ${paris.postalCode}`,
  footer_paris_phone: paris.phonePrimary,
  footer_massage_phone: paris.phoneSecondary ?? "903-739-9959",
  footer_ss_address: `${ss.streetAddress}, ${ss.addressLocality}, ${ss.addressRegion} ${ss.postalCode}`,
  footer_ss_phone: ss.phonePrimary,
  footer_copyright: `Â© ${new Date().getFullYear()} ${siteShortName}. All rights reserved.`,

  nav_giftcard_url: GIFT_CARD_ORDER_URL,
  nav_book_url: "/contact",

  ...wellnessCarePlansDefaults(),
  ...buildSSCmsDefaults(),
  ...buildParisStaffCmsDefaults(),
  ...buildSSStaffCmsDefaults(),
  ...buildHeaderBrandingCmsDefaults(),
  ...buildStaticPagesCmsDefaults(),
};

export const CONTENT_IDS = CONTENT_REGISTRY.map((f) => f.id);

const registryById = new Map(CONTENT_REGISTRY.map((f) => [f.id, f]));

export function getContentFieldMeta(id: string): ContentFieldMeta | undefined {
  return registryById.get(id);
}

export function parseConditionsList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Escape HTML and convert newlines to breaks for simple richtext stored as plain text. */
export function renderRichText(value: string): string {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return escaped.replace(/\n/g, "<br />");
}
