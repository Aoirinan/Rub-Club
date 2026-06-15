/**
 * Practice landing pages (backpro.net-style layout) for the two chiro locations:
 *   - /services/chiropractic  → practice_pages/paris-chiro
 *   - /sulphur-springs        → practice_pages/sulphur-springs
 *
 * Server-side reads and defaults. One structured Firestore doc per location
 * drives ten shared section components (components/practice/); testimonials
 * live in a per-location subcollection. Defaults are built from the pages'
 * current live CMS copy so an unseeded or partially-filled doc never breaks
 * either page. Client-safe types/constants are in lib/practice-pages-shared.ts.
 */

import { getFirestore } from "@/lib/firebase-admin";
import { getContentMany } from "@/lib/cms";
import { parseChiroTreatments } from "@/lib/chiro-treatments";
import { parisChiroServiceSlugForName } from "@/lib/paris-chiro-services";
import { SS_INJURIES, SS_SERVICES } from "@/lib/sulphur-springs-content";
import { ssPageCardBlurbId, ssPageCardImageId, ssPageMetaId } from "@/lib/ss-cms-registry";
import { CHIRO, HOME_INTRO, MASSAGE } from "@/lib/home-verbatim";
import { IMAGES } from "@/lib/home-images";
import {
  FACEBOOK_URL,
  GIFT_CARD_ORDER_URL,
  INSTAGRAM_URL,
  LOCATIONS,
  WELLNESS_CARE_PLANS_PATH,
} from "@/lib/constants";
import {
  PRACTICE_PAGES_COLLECTION,
  PRACTICE_TESTIMONIALS_SUBCOLLECTION,
  EMPTY_PRACTICE_THEME,
  mergePracticePageDoc,
  parsePracticeTestimonialDoc,
  type PracticeLocationId,
  type PracticePageDoc,
  type PracticeServiceCard,
  type PracticeTestimonial,
} from "@/lib/practice-pages-shared";

export * from "@/lib/practice-pages-shared";

/* ------------------------------------------------------------------ */
/*  Defaults — built from each page's current live CMS copy            */
/* ------------------------------------------------------------------ */

function mapsEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

const PARIS_DEFAULT_CMS_IDS = [
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
  "chiro_wellness_teaser_heading",
  "chiro_wellness_teaser_body",
  "footer_paris_address",
  "footer_paris_phone",
  "footer_massage_phone",
  "footer_paris_maps_url",
] as const;

const HOME_DEFAULT_CMS_IDS = [
  "home_hero_heading",
  "home_hero_subheading",
  "home_hero_cta_label",
  "home_awards_text",
  "home_about_blurb",
  "home_testimonials_heading",
  "chiro_choose_title",
  "chiro_intro_body",
  "chiro_conditions_list",
  "chiro_wellness_teaser_heading",
  "chiro_wellness_teaser_body",
  "footer_paris_address",
  "footer_paris_phone",
  "footer_massage_phone",
  "footer_paris_maps_url",
] as const;

const SS_DEFAULT_CMS_IDS = [
  "ss_hero_heading",
  "ss_intro_body",
  "ss_doctor_heading",
  "ss_doctor_intro",
  "footer_ss_address",
  "footer_ss_phone",
  "footer_ss_maps_url",
] as const;

/** Hardcoded paragraphs that currently follow `ss_intro_body` on /sulphur-springs. */
const SS_INTRO_EXTRA_PARAGRAPHS = [
  "Upon your initial examination, we will discuss with you our findings and what they mean. We will create a custom treatment plan to get you to where you want to be, whether that means less pain, better performance, or just better overall health.",
  "Through our expert care, our advanced office, and our caring staff, we will help you not only get back on your feet, but understand how spine health affects your overall quality of life.",
] as const;

async function buildParisChiroDefaults(): Promise<PracticePageDoc> {
  const c = await getContentMany([...PARIS_DEFAULT_CMS_IDS]);
  const paris = LOCATIONS.paris;
  const ss = LOCATIONS.sulphur_springs;
  const parisPhone = c.footer_paris_phone?.trim() || paris.phonePrimary;
  const massagePhone = c.footer_massage_phone?.trim() || paris.phoneSecondary || "";

  const treatmentCards: PracticeServiceCard[] = parseChiroTreatments(
    c.chiro_treatments_list ?? "",
  ).map((t) => {
    const slug = parisChiroServiceSlugForName(t.name);
    const isMassage = /massage/i.test(t.name);
    return {
      name: t.name,
      blurb: t.desc,
      imageUrl: "",
      // Therapeutic massage refers out to The Rub Club's page.
      href: isMassage ? "/services/massage" : slug ? `/services/chiropractic/${slug}` : "",
    };
  });
  treatmentCards.push({
    name: "Auto Injury Care",
    blurb: "Evaluation and treatment after car accidents — one of the conditions we treat most.",
    imageUrl: "",
    href: "",
  });

  const conditions = (c.chiro_conditions_list ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    id: "paris-chiro",
    theme: EMPTY_PRACTICE_THEME,
    utilityBar: {
      published: true,
      phones: [
        { label: "Chiropractic", number: parisPhone },
        ...(massagePhone ? [{ label: "Massage — The Rub Club", number: massagePhone }] : []),
        { label: "Sulphur Springs", number: ss.phonePrimary },
      ],
      address:
        c.footer_paris_address?.trim() ||
        `${paris.streetAddress}, ${paris.addressLocality}, ${paris.addressRegion} ${paris.postalCode}`,
      mapsUrl: c.footer_paris_maps_url?.trim() || paris.mapsUrl,
      socialLinks: [
        { platform: "facebook", url: FACEBOOK_URL },
        { platform: "instagram", url: INSTAGRAM_URL },
      ],
    },
    hero: {
      published: true,
      eyebrow: "Chiropractic Associates · Paris, TX",
      heading: c.chiro_hero_heading ?? "",
      tagline: c.chiro_hero_subheading ?? "",
      imageUrl: IMAGES.chiroBg,
      slides: [],
      ctaLabel: "Request Appointment",
      ctaUrl: "",
      callPhone: parisPhone,
    },
    quickActions: {
      published: true,
      items: [
        { label: "Meet Our Team", icon: "team", url: "/about" },
        { label: "New Patient Forms", icon: "forms", url: "/patient-forms" },
        { label: "Office Hours", icon: "hours", url: "/locations/paris" },
        { label: "Schedule Appointment", icon: "calendar", url: "/book" },
      ],
    },
    servicesGrid: {
      published: true,
      heading: c.chiro_treatments_heading ?? "",
      intro: c.chiro_treatments_intro ?? "",
      mode: "custom",
      cards: treatmentCards,
    },
    aboutBlocks: [
      {
        id: "welcome",
        published: true,
        heading: c.chiro_choose_title ?? "",
        body: c.chiro_intro_body ?? "",
        bullets: conditions,
        imageUrl: IMAGES.chiroBg,
        phoneCtaLabel: "Call Paris Office",
        ctaLabel: "",
        ctaUrl: "",
      },
    ],
    reviews: {
      published: true,
      heading: c.chiro_testimonials_heading ?? "What Our Chiropractic Patients Say",
      linkToReviewsPage: true,
      reviewsUrl: "/reviews",
      reviewsLinkLabel: "Read more patient reviews",
    },
    teamSections: [
      {
        id: "doctors",
        published: true,
        heading: c.chiro_doctors_heading ?? "Our Paris chiropractors",
        intro: c.chiro_doctors_intro ?? "",
        source: "paris-doctors",
        variant: "cards",
        linkUrl: "/about",
        linkLabel: "Meet our doctors",
      },
    ],
    locationBlock: {
      published: true,
      heading: CHIRO.mainOfficeTitle,
      mapEmbedUrl: mapsEmbedUrl(
        `${paris.streetAddress} ${paris.addressLocality} ${paris.addressRegion} ${paris.postalCode}`,
      ),
      hoursSource: "paris",
      showSecondaryLocations: true,
    },
    extras: [
      {
        id: "wellness",
        published: true,
        heading: c.chiro_wellness_teaser_heading ?? "",
        body: c.chiro_wellness_teaser_body ?? "",
        ctaLabel: "View wellness care plans",
        ctaUrl: WELLNESS_CARE_PLANS_PATH,
        links: [],
      },
      {
        id: "awards",
        published: true,
        heading: "Awards",
        body: CHIRO.awards,
        ctaLabel: "",
        ctaUrl: "",
        links: [],
      },
      {
        id: "contact",
        published: true,
        heading: c.chiro_cta_heading ?? "",
        body: c.chiro_cta_subtext ?? "",
        ctaLabel: "Patient forms",
        ctaUrl: "/patient-forms",
        links: [],
      },
    ],
    stickyCallBar: {
      enabled: true,
      callLabel: "Call Us",
      phone: parisPhone,
      bookLabel: "Book Now",
      bookUrl: "/book",
    },
  };
}

async function buildParisHomeDefaults(): Promise<PracticePageDoc> {
  const c = await getContentMany([...HOME_DEFAULT_CMS_IDS]);
  const paris = LOCATIONS.paris;
  const ss = LOCATIONS.sulphur_springs;
  const parisPhone = c.footer_paris_phone?.trim() || paris.phonePrimary;
  const massagePhone = c.footer_massage_phone?.trim() || paris.phoneSecondary || "";

  const conditions = (c.chiro_conditions_list ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    id: "paris-home",
    theme: EMPTY_PRACTICE_THEME,
    utilityBar: {
      published: true,
      phones: [
        { label: "Chiropractic", number: parisPhone },
        ...(massagePhone ? [{ label: "Massage — The Rub Club", number: massagePhone }] : []),
        { label: "Sulphur Springs", number: ss.phonePrimary },
      ],
      address:
        c.footer_paris_address?.trim() ||
        `${paris.streetAddress}, ${paris.addressLocality}, ${paris.addressRegion} ${paris.postalCode}`,
      mapsUrl: c.footer_paris_maps_url?.trim() || paris.mapsUrl,
      socialLinks: [
        { platform: "facebook", url: FACEBOOK_URL },
        { platform: "instagram", url: INSTAGRAM_URL },
      ],
    },
    hero: {
      published: true,
      eyebrow: CHIRO.spineHeadline,
      heading: c.home_hero_heading ?? "",
      tagline: c.home_hero_subheading ?? "",
      imageUrl: IMAGES.chiroBg,
      slides: [],
      ctaLabel: c.home_hero_cta_label?.trim() || "Book Now",
      ctaUrl: "",
      callPhone: parisPhone,
    },
    quickActions: {
      published: true,
      items: [
        { label: "Meet Our Team", icon: "team", url: "/about" },
        { label: "New Patient Forms", icon: "forms", url: "/patient-forms" },
        { label: "Office Hours", icon: "hours", url: "/locations/paris" },
        { label: "Schedule Appointment", icon: "calendar", url: "/book" },
      ],
    },
    servicesGrid: {
      published: true,
      heading: "Our Services",
      intro: c.home_about_blurb ?? HOME_INTRO.body,
      mode: "custom",
      cards: [
        {
          name: "Deep Tissue Massage",
          blurb: "",
          imageUrl: IMAGES.serviceDeepTissue,
          href: "/services/massage",
        },
        {
          name: "Pre-Natal Massage",
          blurb: "",
          imageUrl: IMAGES.servicePrenatal,
          href: "/services/massage",
        },
        {
          name: "Chiropractic Care",
          blurb: "",
          imageUrl: IMAGES.massageChiroTile,
          href: "/services/chiropractic",
        },
        {
          name: "Sports Massage",
          blurb: "",
          imageUrl: IMAGES.serviceSports,
          href: "/services/massage",
        },
        {
          name: "Gift Cards",
          blurb: "",
          imageUrl: IMAGES.rubClubLogo,
          href: GIFT_CARD_ORDER_URL,
        },
        {
          name: "Stretch & Flex Rehab",
          blurb: CHIRO.stretchP1,
          imageUrl: "",
          href: "/book?service=stretch",
        },
      ],
    },
    aboutBlocks: [
      {
        id: "choose-chiropractors",
        published: true,
        heading: c.chiro_choose_title ?? CHIRO.chooseTitle,
        body: c.chiro_intro_body ?? "",
        bullets: conditions,
        imageUrl: IMAGES.chiroBg,
        phoneCtaLabel: "",
        ctaLabel: "Explore chiropractic care",
        ctaUrl: "/services/chiropractic",
      },
      {
        id: "rub-club-stress",
        published: true,
        heading: MASSAGE.stressTitle,
        body: MASSAGE.stressParas.join("\n\n"),
        bullets: [],
        imageUrl: IMAGES.massagePatient,
        phoneCtaLabel: "",
        ctaLabel: "Explore massage services",
        ctaUrl: "/services/massage",
      },
    ],
    reviews: {
      published: true,
      heading: c.home_testimonials_heading?.trim() || "What our patients say",
      linkToReviewsPage: true,
      reviewsUrl: "/reviews",
      reviewsLinkLabel: "Read more patient reviews",
    },
    teamSections: [
      {
        id: "doctors",
        published: true,
        heading: "Our Chiropractors",
        intro:
          "Dr. Greg Thompson, Dr. Sean Welborn, and Dr. Brandy Collins serve our Paris office. Dr. Conner Collins leads care in Sulphur Springs.",
        source: "paris-doctors",
        variant: "expanded",
        linkUrl: "/about",
        linkLabel: "Meet our doctors",
      },
      {
        id: "massage-team",
        published: true,
        heading: "Meet the Team",
        intro: "Massage therapy — The Rub Club",
        source: "rub-club-team",
        variant: "cards",
        linkUrl: "/locations/paris/staff",
        linkLabel: "Our Paris office team",
      },
    ],
    locationBlock: {
      published: true,
      heading: "Contact Us",
      mapEmbedUrl: mapsEmbedUrl(
        `${paris.streetAddress} ${paris.addressLocality} ${paris.addressRegion} ${paris.postalCode}`,
      ),
      hoursSource: "paris",
      showSecondaryLocations: true,
    },
    extras: [
      {
        id: "wellness",
        published: true,
        heading: c.chiro_wellness_teaser_heading ?? "",
        body: c.chiro_wellness_teaser_body ?? "",
        ctaLabel: "View wellness care plans",
        ctaUrl: WELLNESS_CARE_PLANS_PATH,
        links: [],
      },
      {
        id: "stretch_flex",
        published: true,
        heading: `${CHIRO.stretchCallPart1} ${CHIRO.stretchCallPart2}`,
        body: [CHIRO.stretchP1, CHIRO.stretchP2].join("\n\n"),
        ctaLabel: "Book Stretch & Flex Rehab",
        ctaUrl: "/book?service=stretch",
        links: [],
      },
      {
        id: "insurance",
        published: true,
        heading: "Insurance & billing",
        body: "We accept many major medical plans for chiropractic visits and file claims on your behalf. Massage therapy is generally self-pay. Call to verify your benefits.",
        ctaLabel: "Insurance details",
        ctaUrl: "/insurance",
        links: [],
      },
    ],
    stickyCallBar: {
      enabled: true,
      callLabel: "Call Us",
      phone: parisPhone,
      bookLabel: "Book Now",
      bookUrl: "/book",
    },
  };
}

async function buildSulphurSpringsDefaults(): Promise<PracticePageDoc> {
  const c = await getContentMany([
    ...SS_DEFAULT_CMS_IDS,
    "footer_paris_phone",
    "footer_massage_phone",
  ]);
  const paris = LOCATIONS.paris;
  const ss = LOCATIONS.sulphur_springs;
  const parisPhone = c.footer_paris_phone?.trim() || paris.phonePrimary;
  const massagePhone = c.footer_massage_phone?.trim() || paris.phoneSecondary || "";
  const ssPhone = c.footer_ss_phone?.trim() || ss.phonePrimary;

  return {
    id: "sulphur-springs",
    theme: EMPTY_PRACTICE_THEME,
    utilityBar: {
      published: true,
      phones: [
        { label: "Chiropractic", number: parisPhone },
        ...(massagePhone ? [{ label: "Massage — The Rub Club", number: massagePhone }] : []),
        { label: "Sulphur Springs", number: ssPhone },
      ],
      address:
        c.footer_ss_address?.trim() ||
        `${ss.streetAddress}, ${ss.addressLocality}, ${ss.addressRegion} ${ss.postalCode}`,
      mapsUrl: c.footer_ss_maps_url?.trim() || ss.mapsUrl,
      socialLinks: [
        { platform: "facebook", url: FACEBOOK_URL },
        { platform: "instagram", url: INSTAGRAM_URL },
      ],
    },
    hero: {
      published: true,
      eyebrow: "Your Spine Health Specialists",
      heading: c.ss_hero_heading ?? "",
      tagline: "Your pain-free life, just around the corner.",
      imageUrl: "/images/staff-ss/hero-2.webp",
      slides: [],
      ctaLabel: "Request Appointment",
      ctaUrl: "",
      callPhone: ssPhone,
    },
    quickActions: {
      published: true,
      items: [
        { label: "Meet Our Team", icon: "team", url: "/sulphur-springs/staff" },
        { label: "New Patient Forms", icon: "forms", url: "/patient-forms" },
        { label: "Office Hours", icon: "hours", url: "#location-contact" },
        { label: "Schedule Appointment", icon: "calendar", url: "/sulphur-springs/contact" },
      ],
    },
    servicesGrid: {
      published: true,
      heading: "Our Services",
      intro: `We offer a variety of services to treat common conditions and injuries. Call ${ssPhone} for more information.`,
      mode: "ss-services",
      cards: [],
    },
    aboutBlocks: [
      {
        id: "welcome",
        published: true,
        heading: c.ss_hero_heading ?? "",
        body: [c.ss_intro_body ?? "", ...SS_INTRO_EXTRA_PARAGRAPHS].filter(Boolean).join("\n\n"),
        bullets: [],
        imageUrl: "",
        phoneCtaLabel: "Call Sulphur Springs",
        ctaLabel: "",
        ctaUrl: "",
      },
    ],
    reviews: {
      published: false,
      heading: "What Our Patients Say",
      linkToReviewsPage: false,
      reviewsUrl: "",
      reviewsLinkLabel: "",
    },
    teamSections: [
      {
        id: "doctors",
        published: true,
        heading: c.ss_doctor_heading?.trim() || "Our Sulphur Springs chiropractor",
        intro: c.ss_doctor_intro?.trim() || "",
        source: "ss-staff",
        variant: "expanded",
        linkUrl: "/sulphur-springs/staff",
        linkLabel: "Meet the full team",
      },
    ],
    locationBlock: {
      published: true,
      heading: "Our Location",
      mapEmbedUrl: mapsEmbedUrl(
        `${ss.streetAddress} ${ss.addressLocality} ${ss.addressRegion} ${ss.postalCode}`,
      ),
      hoursSource: "ss",
      showSecondaryLocations: false,
    },
    extras: [
      {
        id: "patient_resources",
        published: true,
        heading: "Patient Resources",
        body: "Helpful links and information about chiropractic care.",
        ctaLabel: "Browse resources",
        ctaUrl: "/sulphur-springs/patient-resources",
        links: [],
      },
      {
        id: "q_and_a",
        published: true,
        heading: "Questions & Answers",
        body: "Common questions about chiropractic treatment answered.",
        ctaLabel: "Read Q&A",
        ctaUrl: "/sulphur-springs/q-and-a",
        links: [],
      },
    ],
    stickyCallBar: {
      enabled: true,
      callLabel: "Call Us",
      phone: ssPhone,
      bookLabel: "Book Now",
      bookUrl: "/sulphur-springs/contact",
    },
  };
}

/** Current live copy for a location (CMS values + static fallbacks). */
export async function buildPracticePageDefaults(
  loc: PracticeLocationId,
): Promise<PracticePageDoc> {
  if (loc === "paris-home") return buildParisHomeDefaults();
  return loc === "paris-chiro" ? buildParisChiroDefaults() : buildSulphurSpringsDefaults();
}

/* ------------------------------------------------------------------ */
/*  Reads                                                              */
/* ------------------------------------------------------------------ */

/** Practice page content: Firestore doc merged over current live defaults. */
export async function getPracticePage(loc: PracticeLocationId): Promise<PracticePageDoc> {
  const defaults = await buildPracticePageDefaults(loc);
  try {
    const snap = await getFirestore().collection(PRACTICE_PAGES_COLLECTION).doc(loc).get();
    if (!snap.exists) return defaults;
    return mergePracticePageDoc(snap.data(), defaults);
  } catch {
    return defaults;
  }
}

export async function listPracticeTestimonials(
  loc: PracticeLocationId,
  opts: { publishedOnly?: boolean } = {},
): Promise<PracticeTestimonial[]> {
  try {
    const snap = await getFirestore()
      .collection(PRACTICE_PAGES_COLLECTION)
      .doc(loc)
      .collection(PRACTICE_TESTIMONIALS_SUBCOLLECTION)
      .get();
    const rows = snap.docs
      .map((d) => parsePracticeTestimonialDoc(d.id, d.data()))
      .filter((t) => t.quote.trim().length > 0);
    const filtered = opts.publishedOnly ? rows.filter((t) => t.published) : rows;
    return filtered.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Sulphur Springs services grid derivation                           */
/* ------------------------------------------------------------------ */

/** First sentence of a blurb, for compact cards. */
function firstSentence(text: string): string {
  const clean = text.trim();
  const match = clean.match(/^[^.!?]+[.!?]/);
  return (match ? match[0] : clean).trim();
}

/**
 * Service cards for the SS grid: existing SS services plus the three injury
 * pages (auto/personal/sports), each with optional per-page card blurb/image
 * CMS overrides, falling back to the current meta description.
 */
export async function getSSServiceCards(): Promise<PracticeServiceCard[]> {
  const pages = [...SS_SERVICES, ...SS_INJURIES];
  const ids = pages.flatMap((s) => [
    ssPageMetaId(s.slug),
    ssPageCardBlurbId(s.slug),
    ssPageCardImageId(s.slug),
  ]);
  const c = await getContentMany(ids);
  return pages.map((s) => {
    const blurbOverride = c[ssPageCardBlurbId(s.slug)]?.trim();
    const metaBlurb = c[ssPageMetaId(s.slug)]?.trim() || s.metaDescription;
    return {
      name: s.title,
      blurb: blurbOverride || firstSentence(metaBlurb),
      imageUrl: c[ssPageCardImageId(s.slug)]?.trim() || "",
      href: `/sulphur-springs/${s.slug}`,
    };
  });
}
