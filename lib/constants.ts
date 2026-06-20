export const TIME_ZONE = "America/Chicago";

/** Public Facebook page (Chiropractic Associates — Paris, TX). */
export const FACEBOOK_URL =
  "https://www.facebook.com/chiropracticparistexas/";

/** The Rub Club on Instagram. */
export const INSTAGRAM_URL = "https://www.instagram.com/therubclub/";

/** On-site wellness membership pricing (Chiro-Fitness / Acu-Fit). */
export const WELLNESS_CARE_PLANS_PATH =
  "/services/chiropractic/wellness-care-plans" as const;

/** Square-hosted gift cards (opens in a new tab from nav/footer). */
export const GIFT_CARD_ORDER_URL =
  "https://squareup.com/gift/3N2XB71C5T20N/order" as const;

export const BUSINESS = {
  openHour: 9,
  openMinute: 0,
  closeHour: 17,
  closeMinute: 0,
  slotStepMinutes: 30,
} as const;

export type LocationId = "paris" | "sulphur_springs";

export type ServiceLine = "massage" | "chiropractic" | "stretch";

export function serviceLineEmailLabel(line: ServiceLine): string {
  switch (line) {
    case "massage":
      return "Massage therapy";
    case "chiropractic":
      return "Chiropractic";
    case "stretch":
      return "Stretch";
  }
}

export function serviceLineEmailLabelLower(line: ServiceLine): string {
  switch (line) {
    case "massage":
      return "massage therapy";
    case "chiropractic":
      return "chiropractic";
    case "stretch":
      return "stretch";
  }
}

/** Legacy public-booking duration union; scheduling APIs accept any 30-min grid length. */
export type DurationMin = 30 | 60 | 90 | 120;

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type LocationInfo = {
  id: LocationId;
  name: string;
  shortName: string;
  slug: "paris" | "sulphur-springs";
  addressLines: readonly string[];
  streetAddress: string;
  addressLocality: string;
  addressRegion: "TX";
  postalCode: string;
  phonePrimary: string;
  phoneSecondary?: string;
  fax?: string;
  /** Latitude / longitude for the office (approximate; refine via GBP). */
  geo: { latitude: number; longitude: number };
  /** Public Google Maps URL — used in contact pages, emails, and JSON-LD `hasMap`. */
  mapsUrl: string;
  /** Google Business Profile review link — set via env or fall back to maps URL. */
  reviewUrl?: string;
  /** Office hours used for JSON-LD `openingHoursSpecification`. Closed days are omitted. */
  openingHours: ReadonlyArray<{
    days: readonly Weekday[];
    opens: string;
    closes: string;
  }>;
};

export const LOCATIONS: Record<LocationId, LocationInfo> = {
  paris: {
    id: "paris",
    name: "Paris — Main office",
    shortName: "Paris, TX",
    slug: "paris",
    addressLines: ["3305 NE Loop 286, Suite A", "Paris, TX 75460"],
    streetAddress: "3305 NE Loop 286, Suite A",
    addressLocality: "Paris",
    addressRegion: "TX",
    postalCode: "75460",
    phonePrimary: "903-785-5551",
    phoneSecondary: "903-739-9959",
    fax: "903-784-4188",
    geo: { latitude: 33.6887, longitude: -95.5277 },
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=3305+NE+Loop+286+Suite+A+Paris+TX+75460",
    openingHours: [
      {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        opens: "08:30",
        closes: "17:00",
      },
    ],
  },
  sulphur_springs: {
    id: "sulphur_springs",
    name: "Sulphur Springs",
    shortName: "Sulphur Springs, TX",
    slug: "sulphur-springs",
    addressLines: ["207 Jefferson St. E", "Sulphur Springs, TX 75482"],
    streetAddress: "207 Jefferson St. E",
    addressLocality: "Sulphur Springs",
    addressRegion: "TX",
    postalCode: "75482",
    phonePrimary: "903-919-5020",
    fax: "903-919-3703",
    geo: { latitude: 33.1387, longitude: -95.6011 },
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=207+Jefferson+St+E+Sulphur+Springs+TX",
    openingHours: [
      {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
  },
};

export const LOCATION_LIST: readonly LocationInfo[] = [
  LOCATIONS.paris,
  LOCATIONS.sulphur_springs,
];

/** Helper to format a US phone (NNN-NNN-NNNN) into a tel: href. */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:+1${digits}`;
}

export type ReviewUrlOverrides = {
  gbpParisReviewUrl?: string;
  gbpSulphurReviewUrl?: string;
};

/** Resolve Google review link: Vercel env → owner settings → Google Maps fallback. */
export function reviewUrlForLocation(id: LocationId, overrides?: ReviewUrlOverrides): string {
  const parisOverride = overrides?.gbpParisReviewUrl?.trim();
  const ssOverride = overrides?.gbpSulphurReviewUrl?.trim();
  if (id === "paris") {
    return (
      process.env.NEXT_PUBLIC_GBP_PARIS_URL?.trim() ||
      parisOverride ||
      LOCATIONS.paris.mapsUrl
    );
  }
  return (
    process.env.NEXT_PUBLIC_GBP_SS_URL?.trim() ||
    ssOverride ||
    LOCATIONS.sulphur_springs.mapsUrl
  );
}
