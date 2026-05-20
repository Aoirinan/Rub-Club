import { telHref, type LocationId, type LocationInfo } from "@/lib/constants";
import {
  DEFAULT_PUBLIC_BOOKING,
  getSiteOwnerConfig,
  type PublicBookingConfig,
} from "@/lib/site-owner-config";

function envDisablesPublicBooking(): boolean {
  const raw = process.env.PUBLIC_BOOKING_ENABLED?.trim().toLowerCase();
  return raw === "false" || raw === "0" || raw === "off";
}

export async function getPublicBookingConfig(): Promise<PublicBookingConfig> {
  try {
    const cfg = await getSiteOwnerConfig();
    const merged: PublicBookingConfig = {
      ...DEFAULT_PUBLIC_BOOKING,
      ...cfg.publicBooking,
      disabledMessage:
        cfg.publicBooking?.disabledMessage?.trim() || DEFAULT_PUBLIC_BOOKING.disabledMessage,
    };
    if (envDisablesPublicBooking()) {
      return { ...merged, enabled: false };
    }
    return merged;
  } catch {
    const fallback = { ...DEFAULT_PUBLIC_BOOKING };
    if (envDisablesPublicBooking()) {
      return { ...fallback, enabled: false };
    }
    return fallback;
  }
}

export function isPublicBookingEnabled(config: PublicBookingConfig): boolean {
  return config.enabled !== false;
}

export function contactAppointmentCopy(bookingEnabled: boolean): string {
  if (bookingEnabled) {
    return "For appointments, please use our online booking page so we can see availability live. Use this form for everything else.";
  }
  return "For appointments, please call the office. Use this form for scheduling questions or other messages.";
}

export function bookingAvailabilityCopy(bookingEnabled: boolean): string {
  if (bookingEnabled) {
    return "Use the online booking page to see live openings, or call the office and we will do our best to fit you in.";
  }
  return "Call the office to schedule — online booking is not available right now.";
}

/** Phone callouts for the disabled booking screen. */
export function bookingDisabledPhones(
  locations: Record<LocationId, LocationInfo>,
): { label: string; phone: string; href: string }[] {
  return [
    {
      label: locations.paris.name,
      phone: locations.paris.phonePrimary,
      href: telHref(locations.paris.phonePrimary),
    },
    {
      label: locations.sulphur_springs.name,
      phone: locations.sulphur_springs.phonePrimary,
      href: telHref(locations.sulphur_springs.phonePrimary),
    },
  ];
}
