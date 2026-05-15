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

type JsonLd = Record<string, unknown>;

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

/** Chiropractic clinic JSON-LD entity for one location. */
export function chiropractorJsonLd(location: LocationInfo): JsonLd {
  const url = siteUrl(`/locations/${location.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": ["Chiropractor", "MedicalBusiness", "LocalBusiness"],
    "@id": `${url}#chiropractic`,
    name: `Chiropractic Associates — ${location.shortName}`,
    legalName: "Chiropractic Associates",
    description:
      "Family-owned chiropractic clinic offering adjustments, spinal decompression, rehab, and acupuncture in Northeast Texas.",
    url,
    telephone: `+1-${location.phonePrimary}`,
    image: siteUrl("/og/og-default.svg"),
    priceRange: "$$",
    address: postalAddress(location),
    geo: geo(location),
    hasMap: location.mapsUrl,
    openingHoursSpecification: openingHoursSpec(location),
    areaServed: ["Paris, TX", "Sulphur Springs, TX", "Northeast Texas"],
    medicalSpecialty: [
      "Chiropractic",
      "PhysicalTherapy",
      "SpineAndNerveSurgery",
    ],
    sameAs: getSocialProfiles(),
  };
}

/** Massage therapy business JSON-LD (Paris only). */
export function massageJsonLd(parisOverride?: LocationInfo): JsonLd {
  const loc = parisOverride ?? LOCATIONS.paris;
  const url = siteUrl(`/locations/${loc.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": ["HealthAndBeautyBusiness", "LocalBusiness"],
    "@id": `${url}#massage`,
    name: "The Rub Club Massage",
    legalName: "The Rub Club",
    description:
      "Licensed massage therapists offering deep tissue, prenatal, and sports massage in Paris, TX.",
    url,
    telephone: loc.phoneSecondary ? `+1-${loc.phoneSecondary}` : `+1-${loc.phonePrimary}`,
    image: siteUrl("/og/og-default.svg"),
    priceRange: "$$",
    address: postalAddress(loc),
    geo: geo(loc),
    hasMap: loc.mapsUrl,
    openingHoursSpecification: openingHoursSpec(loc),
    areaServed: ["Paris, TX", "Northeast Texas"],
    sameAs: getSocialProfiles(),
  };
}

/** Top-level Organization linking the two brands. */
export function organizationJsonLd(locations: readonly LocationInfo[] = LOCATION_LIST): JsonLd {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${origin}#organization`,
    name: siteShortName,
    url: origin,
    logo: siteUrl("/og/og-default.svg"),
    description: siteDescription,
    sameAs: getSocialProfiles(),
    contactPoint: locations.map((loc) => ({
      "@type": "ContactPoint",
      contactType: "Reservations",
      telephone: `+1-${loc.phonePrimary}`,
      areaServed: loc.shortName,
      availableLanguage: ["English", "Spanish"],
    })),
  };
}

export function websiteJsonLd(): JsonLd {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}#website`,
    url: origin,
    name: siteShortName,
    description: siteDescription,
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
