export const TIME_ZONE = "America/Chicago";

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

export const LOCATIONS: Record<
  LocationId,
  {
    name: string;
    shortName: string;
    addressLines: string[];
    phonePrimary: string;
    phoneSecondary?: string;
  }
> = {
  paris: {
    name: "Paris — Main office",
    shortName: "Paris, TX",
    addressLines: ["3305 NE Loop 286, Suite A", "Paris, TX 75460"],
    phonePrimary: "903-785-5551",
    phoneSecondary: "903-739-9959",
  },
  sulphur_springs: {
    name: "Sulphur Springs",
    shortName: "Sulphur Springs, TX",
    addressLines: ["207 Jefferson St. E", "Sulphur Springs, TX"],
    phonePrimary: "903-919-5020",
  },
};
