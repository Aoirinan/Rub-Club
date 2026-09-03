import { LOCATIONS } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import type { EmailLocations } from "@/lib/email-templates";

/**
 * Office phones/addresses/names for emails, texts, and calendar invites:
 * CMS + owner overrides merged over the constants. Never throws — falls back
 * to the constants so a Firestore hiccup can't block a notification.
 */
export async function emailLocations(): Promise<EmailLocations> {
  try {
    return await getDisplayLocations();
  } catch {
    return LOCATIONS;
  }
}
