import { createHash } from "node:crypto";
import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentReference,
  type Transaction,
} from "firebase-admin/firestore";

/**
 * Public booking submits are remembered by the request id the wizard sends, so
 * a patient who resubmits after a dropped connection gets their original
 * confirmation back instead of "taken by someone else" (they took it) or a
 * second visit with another provider.
 */
export const BOOKING_REQUESTS_COLLECTION = "booking_requests";

/**
 * How long a request id is kept. Stored as `expiresAt` so a Firestore TTL
 * policy on that field can clean the collection up; a record that is still
 * there is honoured whatever its age.
 */
export const BOOKING_REQUEST_TTL_HOURS = 24;

const REQUEST_ID_RE = /^[A-Za-z0-9_-]{16,80}$/;

/** Random ids only: long enough to be unguessable, safe as a document id. */
export function isValidBookingRequestId(raw: unknown): raw is string {
  return typeof raw === "string" && REQUEST_ID_RE.test(raw);
}

export type BookingRequestFingerprintInput = {
  locationId: string;
  serviceLine: string;
  durationMin: number;
  schedulerServiceId?: string;
  startIso: string;
  email: string;
  providerMode: string;
  providerId?: string;
  recurrence?: { frequency: string; count: number };
};

/**
 * What makes two submits "the same booking". A repeated id carrying a different
 * booking (another time, patient, provider or service) is refused rather than
 * replayed, so one patient's id can never return another's confirmation.
 */
export function bookingRequestFingerprint(input: BookingRequestFingerprintInput): string {
  const key = JSON.stringify([
    input.locationId,
    input.serviceLine,
    input.durationMin,
    input.schedulerServiceId?.trim() ?? "",
    input.startIso.trim(),
    input.email.trim().toLowerCase(),
    input.providerMode,
    input.providerId?.trim() ?? "",
    input.recurrence ? [input.recurrence.frequency, input.recurrence.count] : null,
  ]);
  return createHash("sha256").update(key).digest("hex");
}

export type BookingRequestReplay =
  | { kind: "none" }
  | { kind: "mismatch" }
  | { kind: "replay"; body: Record<string, unknown> };

/**
 * What a repeated request id gets back from its stored record: the original
 * success response once it was saved, or one rebuilt from the visits recorded
 * so far while the first submit is still sending its notices.
 */
export function replayFromBookingRequest(
  data: DocumentData | undefined,
  fingerprint: string,
): BookingRequestReplay {
  if (!data) return { kind: "none" };
  if (data.fingerprint !== fingerprint) return { kind: "mismatch" };
  const response = data.response;
  if (response && typeof response === "object" && !Array.isArray(response)) {
    return { kind: "replay", body: response as Record<string, unknown> };
  }
  const ids = Array.isArray(data.bookingIds)
    ? data.bookingIds.filter((x: unknown): x is string => typeof x === "string" && x.length > 0)
    : [];
  if (ids.length === 0) return { kind: "none" };
  return {
    kind: "replay",
    body: {
      ok: true,
      bookingId: ids[0],
      bookingIds: ids,
      status: "pending",
      providerId: typeof data.providerId === "string" ? data.providerId : "",
      providerDisplayName: typeof data.providerDisplayName === "string" ? data.providerDisplayName : "",
      providerMode: data.providerMode === "any" ? "any" : "specific",
      totalCreated: ids.length,
    },
  };
}

/**
 * First read of a booking transaction. Throws `duplicate_request` when another
 * submit with this id already booked; a later visit of the SAME submit (a
 * weekly series books one transaction per visit) carries the same `attempt`.
 */
export async function readBookingRequestInTx(
  tx: Transaction,
  ref: DocumentReference,
  attempt: string,
): Promise<{ exists: boolean }> {
  const snap = await tx.get(ref);
  if (snap.exists && snap.get("attempt") !== attempt) {
    throw new Error("duplicate_request");
  }
  return { exists: snap.exists };
}

/** Record this visit against the request id, in the transaction that books it. */
export function writeBookingRequestInTx(
  tx: Transaction,
  ref: DocumentReference,
  params: {
    exists: boolean;
    attempt: string;
    fingerprint: string;
    bookingId: string;
    providerId: string;
    providerDisplayName: string;
    providerMode: "specific" | "any";
    nowMs?: number;
  },
): void {
  const nowMs = params.nowMs ?? Date.now();
  tx.set(
    ref,
    {
      attempt: params.attempt,
      fingerprint: params.fingerprint,
      bookingIds: FieldValue.arrayUnion(params.bookingId),
      providerId: params.providerId,
      providerDisplayName: params.providerDisplayName,
      providerMode: params.providerMode,
      ...(params.exists
        ? {}
        : {
            createdAt: FieldValue.serverTimestamp(),
            expiresAt: Timestamp.fromMillis(nowMs + BOOKING_REQUEST_TTL_HOURS * 3_600_000),
          }),
    },
    { merge: true },
  );
}
