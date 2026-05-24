import { fetchProviderById } from "./providers-db";
import { getFirestore } from "./firebase-admin";
import { notificationAllowedNow } from "./provider-profile";

export async function providerAllowsReminderChannel(
  providerId: string | undefined | null,
  channel: "sms" | "email",
  atMs: number = Date.now(),
): Promise<boolean> {
  if (!providerId?.trim()) {
    return notificationAllowedNow(null, channel, atMs);
  }
  const db = getFirestore();
  const provider = await fetchProviderById(db, providerId.trim());
  if (!provider) return notificationAllowedNow(null, channel, atMs);
  return notificationAllowedNow(provider.notificationWindows, channel, atMs);
}
