export const TIME_ZONE = "America/Chicago";

/** Public Facebook page (Chiropractic Associates — Paris, TX). */
export const FACEBOOK_URL =
  "https://www.facebook.com/chiropracticparistexas/";

export const BUSINESS = {
  openHour: 9,
  openMinute: 0,
  closeHour: 17,
  closeMinute: 0,
  slotStepMinutes: 30,
} as const;

export type LocationId = "paris" | "sulphur_springs";

export type ServiceLine = "massage" | "chiropractic";

export type DurationMin = 30 | 60;

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
    geo: { latitude: 33.6757, longitude: -95.5141 },
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=3305+NE+Loop+286+Suite+A+Paris+TX+75460",
    openingHours: [
      {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        opens: "09:00",
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

/** Resolve Google Business Profile review URLs from env, falling back to maps. */
export function reviewUrlForLocation(id: LocationId): string {
  if (id === "paris") {
    return process.env.NEXT_PUBLIC_GBP_PARIS_URL ?? LOCATIONS.paris.mapsUrl;
  }
  return (
    process.env.NEXT_PUBLIC_GBP_SS_URL ?? LOCATIONS.sulphur_springs.mapsUrl
  );
}
