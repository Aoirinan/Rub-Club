import { siteUrl } from "./site-content";

/** `/book` query helper for CTAs (always live). */
export function publicBookingHref(query = ""): string {
  const q = query.startsWith("?") ? query : query ? `?${query}` : "";
  return `/book${q}`;
}

export const BOOKING_DISABLED_TITLE =
  "Online scheduling opens soon — please call the office.";

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
