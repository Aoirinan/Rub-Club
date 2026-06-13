import { FieldValue, type DocumentData, type Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";

export const CONTACT_SUBMISSIONS_COLLECTION = "contact_submissions";

export type ContactSubmissionStatus = "new" | "read" | "archived";

/** Which office a contact message belongs to. */
export type ContactLocationId = "paris" | "sulphur_springs";

export type ContactSubmissionRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  topic?: string;
  message: string;
  /** Office the message was sent to. Older rows may not have this. */
  location?: ContactLocationId;
  status: ContactSubmissionStatus;
  officeEmailSent: boolean;
  autoReplySent: boolean;
  createdAt: string | null;
};

export type ContactSubmissionInput = {
  name: string;
  email: string;
  phone?: string;
  topic?: string;
  message: string;
  location?: ContactLocationId;
};

function parseLocation(value: unknown): ContactLocationId | undefined {
  return value === "paris" || value === "sulphur_springs" ? value : undefined;
}

function timestampToIso(value: Timestamp | Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }
  return null;
}

function parseDoc(id: string, data: DocumentData | undefined): ContactSubmissionRecord | null {
  if (!data) return null;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const message = typeof data.message === "string" ? data.message : "";
  if (!name || !email || !message) return null;

  const statusRaw = typeof data.status === "string" ? data.status.trim() : "new";
  const status: ContactSubmissionStatus =
    statusRaw === "read" || statusRaw === "archived" ? statusRaw : "new";

  return {
    id,
    name,
    email,
    phone: typeof data.phone === "string" && data.phone.trim() ? data.phone.trim() : undefined,
    topic: typeof data.topic === "string" && data.topic.trim() ? data.topic.trim() : undefined,
    message,
    location: parseLocation(data.location),
    status,
    officeEmailSent: data.officeEmailSent === true,
    autoReplySent: data.autoReplySent === true,
    createdAt: timestampToIso(data.createdAt as Timestamp | undefined),
  };
}

export async function createContactSubmission(
  input: ContactSubmissionInput,
): Promise<string> {
  const db = getFirestore();
  const ref = db.collection(CONTACT_SUBMISSIONS_COLLECTION).doc();
  await ref.set({
    name: input.name,
    email: input.email,
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.topic ? { topic: input.topic } : {}),
    message: input.message,
    ...(input.location ? { location: input.location } : {}),
    status: "new",
    officeEmailSent: false,
    autoReplySent: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateContactSubmissionDelivery(
  id: string,
  patch: { officeEmailSent?: boolean; autoReplySent?: boolean },
): Promise<void> {
  const db = getFirestore();
  await db
    .collection(CONTACT_SUBMISSIONS_COLLECTION)
    .doc(id)
    .set(
      {
        ...(patch.officeEmailSent !== undefined ? { officeEmailSent: patch.officeEmailSent } : {}),
        ...(patch.autoReplySent !== undefined ? { autoReplySent: patch.autoReplySent } : {}),
      },
      { merge: true },
    );
}

/**
 * Location scope for reading submissions:
 * - "paris" / "sulphur_springs": only that office's messages.
 * - "all": every message (used by superadmins / both-access staff).
 * Rows with no stored `location` (older messages) are only visible to "all".
 */
export type ContactLocationScope = ContactLocationId | "all";

function rowMatchesScope(
  row: ContactSubmissionRecord,
  scope: ContactLocationScope,
): boolean {
  if (scope === "all") return true;
  return row.location === scope;
}

export async function listContactSubmissions(options?: {
  status?: ContactSubmissionStatus | "all";
  location?: ContactLocationScope;
  limit?: number;
}): Promise<ContactSubmissionRecord[]> {
  const db = getFirestore();
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 200);
  const scope = options?.location ?? "all";
  const filtered = (options?.status && options.status !== "all") || scope !== "all";
  const fetchLimit = filtered ? 200 : limit;

  const snap = await db
    .collection(CONTACT_SUBMISSIONS_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(fetchLimit)
    .get();

  const rows: ContactSubmissionRecord[] = [];
  for (const doc of snap.docs) {
    const row = parseDoc(doc.id, doc.data());
    if (!row) continue;
    if (options?.status && options.status !== "all" && row.status !== options.status) continue;
    if (!rowMatchesScope(row, scope)) continue;
    rows.push(row);
    if (rows.length >= limit) break;
  }
  return rows;
}

export async function updateContactSubmissionStatus(
  id: string,
  status: ContactSubmissionStatus,
): Promise<boolean> {
  const db = getFirestore();
  const ref = db.collection(CONTACT_SUBMISSIONS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.set({ status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return true;
}

export async function countNewContactSubmissions(
  location: ContactLocationScope = "all",
): Promise<number> {
  const db = getFirestore();
  const snap = await db
    .collection(CONTACT_SUBMISSIONS_COLLECTION)
    .where("status", "==", "new")
    .limit(200)
    .get();
  if (location === "all") return snap.size;
  let count = 0;
  for (const doc of snap.docs) {
    const row = parseDoc(doc.id, doc.data());
    if (row && rowMatchesScope(row, location)) count += 1;
  }
  return count;
}

/** Read a single submission (for scope checks before mutating). */
export async function getContactSubmission(
  id: string,
): Promise<ContactSubmissionRecord | null> {
  const db = getFirestore();
  const snap = await db.collection(CONTACT_SUBMISSIONS_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return parseDoc(snap.id, snap.data());
}
