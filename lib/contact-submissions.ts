import { FieldValue, type DocumentData, type Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";

export const CONTACT_SUBMISSIONS_COLLECTION = "contact_submissions";

export type ContactSubmissionStatus = "new" | "read" | "archived";

export type ContactSubmissionRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  topic?: string;
  message: string;
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
};

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

export async function listContactSubmissions(options?: {
  status?: ContactSubmissionStatus | "all";
  limit?: number;
}): Promise<ContactSubmissionRecord[]> {
  const db = getFirestore();
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 200);
  const fetchLimit = options?.status && options.status !== "all" ? Math.min(limit * 4, 200) : limit;

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

export async function countNewContactSubmissions(): Promise<number> {
  const db = getFirestore();
  const snap = await db
    .collection(CONTACT_SUBMISSIONS_COLLECTION)
    .where("status", "==", "new")
    .limit(200)
    .get();
  return snap.size;
}
