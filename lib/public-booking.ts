import { siteUrl } from "./site-content";

/** `/book` query helper for CTAs (always live). */
export function publicBookingHref(query = ""): string {
  const q = query.startsWith("?") ? query : query ? `?${query}` : "";
  return `/book${q}`;
}

export const BOOKING_DISABLED_TITLE =
  "Online scheduling opens soon — please call the office.";

export function bookingAvailabilityCopy(): string {
  return "Use the online booking page to see live openings, or call the office and we will do our best to fit you in.";
}

export function contactAppointmentCopy(): string {
  return "For appointments, please use our online booking page so we can see availability live. Use this form for everything else.";
}

export function homeBookingFooterCopy(): string {
  return "Online booking on this site collects only your contact details and preferred visit time so the office can confirm your appointment. We do not collect insurance or medical records here. Please do not share protected health information through the contact form.";
}

export function publicBookingEmailUrl(): string {
  return siteUrl("/book");
}

export function publicBookingRebookText(loc: {
  phonePrimary: string;
  phoneSecondary?: string | null;
}): string {
  const massage = loc.phoneSecondary ? ` (massage desk ${loc.phoneSecondary})` : "";
  return `Pick a new time at ${siteUrl("/book")} or call ${loc.phonePrimary}${massage}.`;
}
