import {
  LOCATIONS,
  LOCATION_LIST,
  type LocationInfo,
  type Weekday,
} from "@/lib/constants";
import {
  getSiteOrigin,
  getSocialProfiles,
  siteDescription,
  siteShortName,
  siteUrl,
} from "@/lib/site-content";
import type { FaqEntry } from "@/lib/faqs";
import type { OfficeHoursRow } from "@/lib/office-hours";
import { hoursShifts } from "@/lib/office-hours-format";
import { CHIRO, MASSAGE } from "@/lib/home-verbatim";
import { JSONLD_DEFAULTS } from "@/lib/site-meta-cms";

type JsonLd = Record<string, unknown>;

/**
 * Editable names/descriptions for the business entities (Site settings →
 * "Search & social"). Server code resolves them with `getJsonLdStrings()`
 * (lib/structured-data-strings.ts); callers that don't pass them get the
 * same defaults the site always used.
 */
export type JsonLdStrings = {
  chiroNameParis: string;
  chiroNameSS: string;
  chiroDescription: string;
  massageName: string;
  massageDescription: string;
  /** Organization / WebSite name. */
  siteName: string;
  /** Organization / WebSite description. */
  siteDescription: string;
  /** Social profile URLs (Facebook, Instagram, …) merged with env-driven ones. */
  sameAs?: string[];
};

export const DEFAULT_JSONLD_STRINGS: JsonLdStrings = {
  ...JSONLD_DEFAULTS,
  siteName: siteShortName,
  siteDescription,
};

function sameAs(strings: JsonLdStrings): string[] {
  return Array.from(new Set([...(strings.sameAs ?? []), ...getSocialProfiles()]));
}

const DAY_NAME_TO_SCHEMA: Record<string, string> = {
  monday: "Monday",
  mon: "Monday",
  tuesday: "Tuesday",
  tue: "Tuesday",
  tues: "Tuesday",
  wednesday: "Wednesday",
  wed: "Wednesday",
  thursday: "Thursday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  friday: "Friday",
  fri: "Friday",
  saturday: "Saturday",
  sat: "Saturday",
  sunday: "Sunday",
  sun: "Sunday",
};

/** "9:00 AM" / "12 pm" / "17:00" -> "HH:MM" (24h), or null when unparseable. */
function to24h(raw: string): string | null {
  const m = raw
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const mer = m[3]?.replace(/\./g, "");
  if (Number.isNaN(h) || Number.isNaN(min) || h > 24 || min > 59) return null;
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  if (h === 24) h = 0;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Turn the displayed office-hours rows (CMS text such as
 * "Monday | 9:00 AM – 6:00 PM, 2:00 PM – 5:00 PM") into schema.org
 * OpeningHoursSpecification entries so JSON-LD matches what the page shows.
 * Rows that cannot be parsed (e.g. "Closed") are skipped.
 */
export function openingHoursSpecFromRows(rows: readonly OfficeHoursRow[]): JsonLd[] {
  const out: JsonLd[] = [];
  for (const row of rows) {
    const day = DAY_NAME_TO_SCHEMA[row.day.trim().toLowerCase().replace(/[.:]/g, "")];
    if (!day) continue;
    for (const shift of hoursShifts(row.hours)) {
      const parts = shift.split(/\s*(?:–|—|-|to)\s*/i);
      if (parts.length !== 2) continue;
      const opens = to24h(parts[0]!);
      const closes = to24h(parts[1]!);
      if (!opens || !closes) continue;
      out.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [day],
        opens,
        closes,
      });
    }
  }
  return out;
}

const WEEKDAY_TO_SCHEMA: Record<Weekday, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

function openingHoursSpec(location: LocationInfo): JsonLd[] {
  return location.openingHours.map((slot) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: slot.days.map((d) => WEEKDAY_TO_SCHEMA[d]),
    opens: slot.opens,
    closes: slot.closes,
  }));
}

function postalAddress(location: LocationInfo): JsonLd {
  return {
    "@type": "PostalAddress",
    streetAddress: location.streetAddress,
    addressLocality: location.addressLocality,
    addressRegion: location.addressRegion,
    postalCode: location.postalCode,
    addressCountry: "US",
  };
}

function geo(location: LocationInfo): JsonLd {
  return {
    "@type": "GeoCoordinates",
    latitude: location.geo.latitude,
    longitude: location.geo.longitude,
  };
}

/**
 * Chiropractic clinic JSON-LD entity for one location.
 * Pass the CMS-resolved `hours` rows the page displays so structured data
 * stays in sync with edits; without them the Paris entity uses the same
 * default chiropractic schedule the page renders (CHIRO.hours), and Sulphur
 * Springs uses the constants that mirror SS_HOURS_DEFAULT_TEXT.
 */
export function chiropractorJsonLd(
  location: LocationInfo,
  hours?: readonly OfficeHoursRow[],
  strings: JsonLdStrings = DEFAULT_JSONLD_STRINGS,
): JsonLd {
  const url = siteUrl(`/locations/${location.slug}`);
  const hoursRows = hours ?? (location.id === "paris" ? CHIRO.hours : undefined);
  const openingHours = hoursRows
    ? openingHoursSpecFromRows(hoursRows)
    : openingHoursSpec(location);
  return {
    "@context": "https://schema.org",
    "@type": ["Chiropractor", "MedicalBusiness", "LocalBusiness"],
    "@id": `${url}#chiropractic`,
    name: location.id === "sulphur_springs" ? strings.chiroNameSS : strings.chiroNameParis,
    legalName: strings.chiroNameParis,
    description: strings.chiroDescription,
    url,
    telephone: `+1${location.phonePrimary.replace(/\D/g, "")}`,
    image: siteUrl("/og/og-default.svg"),
    priceRange: "$$",
    address: postalAddress(location),
    geo: geo(location),
    hasMap: location.mapsUrl,
    openingHoursSpecification: openingHours.length ? openingHours : openingHoursSpec(location),
    areaServed: ["Paris, TX", "Sulphur Springs, TX", "Northeast Texas"],
    // schema.org MedicalSpecialty enumeration values (no "Chiropractic"/"PhysicalTherapy" members).
    medicalSpecialty: ["Musculoskeletal", "Physiotherapy"],
    sameAs: sameAs(strings),
  };
}

/**
 * Massage therapy business JSON-LD (Paris only). Pass the CMS-resolved
 * location (phone overrides) and the displayed hours rows when available.
 */
export function massageJsonLd(
  parisOverride?: LocationInfo,
  hours?: readonly OfficeHoursRow[],
  strings: JsonLdStrings = DEFAULT_JSONLD_STRINGS,
): JsonLd {
  const loc = parisOverride ?? LOCATIONS.paris;
  const url = siteUrl(`/locations/${loc.slug}`);
  const openingHours = openingHoursSpecFromRows(hours ?? MASSAGE.hours);
  return {
    "@context": "https://schema.org",
    "@type": ["HealthAndBeautyBusiness", "LocalBusiness"],
    "@id": `${url}#massage`,
    name: strings.massageName,
    legalName: "The Rub Club",
    description: strings.massageDescription,
    url,
    telephone: `+1${(loc.phoneSecondary ?? loc.phonePrimary).replace(/\D/g, "")}`,
    image: siteUrl("/og/og-default.svg"),
    priceRange: "$$",
    address: postalAddress(loc),
    geo: geo(loc),
    hasMap: loc.mapsUrl,
    openingHoursSpecification: openingHours.length ? openingHours : openingHoursSpec(loc),
    areaServed: ["Paris, TX", "Northeast Texas"],
    sameAs: sameAs(strings),
  };
}

/** Top-level Organization linking the two brands. */
export function organizationJsonLd(
  locations: readonly LocationInfo[] = LOCATION_LIST,
  strings: JsonLdStrings = DEFAULT_JSONLD_STRINGS,
): JsonLd {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${origin}#organization`,
    name: strings.siteName,
    url: origin,
    logo: siteUrl("/og/og-default.svg"),
    description: strings.siteDescription,
    sameAs: sameAs(strings),
    contactPoint: locations.map((loc) => ({
      "@type": "ContactPoint",
      contactType: "Reservations",
      telephone: `+1${loc.phonePrimary.replace(/\D/g, "")}`,
      areaServed: loc.shortName,
      availableLanguage: ["English", "Spanish"],
    })),
  };
}

export function websiteJsonLd(strings: JsonLdStrings = DEFAULT_JSONLD_STRINGS): JsonLd {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}#website`,
    url: origin,
    name: strings.siteName,
    description: strings.siteDescription,
    inLanguage: "en-US",
    publisher: { "@id": `${origin}#organization` },
  };
}

export function breadcrumbJsonLd(
  items: readonly { name: string; url: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : siteUrl(item.url),
    })),
  };
}

export function faqPageJsonLd(entries: readonly FaqEntry[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: e.a,
      },
    })),
  };
}

export function serviceJsonLd(params: {
  name: string;
  description: string;
  url: string;
  serviceType: string;
  location?: LocationInfo;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: params.name,
    description: params.description,
    serviceType: params.serviceType,
    url: params.url.startsWith("http") ? params.url : siteUrl(params.url),
    provider: { "@id": `${getSiteOrigin()}#organization` },
    areaServed: params.location
      ? params.location.shortName
      : ["Paris, TX", "Sulphur Springs, TX", "Northeast Texas"],
  };
}
