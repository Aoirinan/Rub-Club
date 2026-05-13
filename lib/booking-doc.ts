import { DateTime } from "luxon";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { DurationMin, LocationId, ServiceLine } from "./constants";
import { TIME_ZONE } from "./constants";
import type { BookingEmailContext } from "./email-templates";

/**
 * Build a `BookingEmailContext` from a Firestore booking document.
 * Returns null when the doc is missing required fields (so callers can skip the email).
 */
export function bookingDocToEmailContext(
  snap: DocumentSnapshot,
): BookingEmailContext | null {
  const data = snap.data();
  if (!data) return null;

  const locationId = data.locationId;
  const serviceLine = data.serviceLine;
  const durationMin = data.durationMin;
  const startIso = data.startIso;
  const email = data.email;
  const name = data.name;
  const phone = data.phone;

  if (locationId !== "paris" && locationId !== "sulphur_springs") return null;
  if (serviceLine !== "massage" && serviceLine !== "chiropractic") return null;
  if (durationMin !== 30 && durationMin !== 60) return null;
  if (typeof startIso !== "string" || !startIso.length) return null;
  if (typeof email !== "string" || !email.length) return null;
  if (typeof name !== "string" || !name.length) return null;
  if (typeof phone !== "string" || !phone.length) return null;

  const start = DateTime.fromISO(startIso, { zone: "utc" }).setZone(TIME_ZONE);
  if (!start.isValid) return null;

  const providerMode = data.providerMode === "any" ? "any" : "specific";

  return {
    bookingId: snap.id,
    locationId: locationId as LocationId,
    serviceLine: serviceLine as ServiceLine,
    durationMin: durationMin as DurationMin,
    start,
    name,
    phone,
    email,
    notes: typeof data.notes === "string" && data.notes.length ? data.notes : undefined,
    providerDisplayName: typeof data.providerDisplayName === "string" ? data.providerDisplayName : "",
    providerMode,
    preferredProviderName:
      typeof data.preferredProviderDisplayName === "string" && data.preferredProviderDisplayName.length
        ? data.preferredProviderDisplayName
        : undefined,
  };
}
