import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import type { ContactLocationId } from "@/lib/contact-submissions";

/**
 * Per-location office notification email addresses for the contact form.
 * Stored in a single Firestore settings doc, editable by superadmins.
 * Falls back to the OFFICE_NOTIFICATION_EMAIL env var when an address is unset.
 */
const SETTINGS_COLLECTION = "app_settings";
const SETTINGS_DOC = "contact_routing";

export type ContactRoutingEmails = {
  parisEmail: string;
  sulphurEmail: string;
};

function cleanEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  const v = value.trim();
  // Light validation; the API route validates strictly with zod on save.
  return v.length <= 200 ? v : "";
}

export async function getContactRoutingEmails(): Promise<ContactRoutingEmails> {
  try {
    const snap = await getFirestore()
      .collection(SETTINGS_COLLECTION)
      .doc(SETTINGS_DOC)
      .get();
    const data = snap.exists ? snap.data() : undefined;
    return {
      parisEmail: cleanEmail(data?.parisEmail),
      sulphurEmail: cleanEmail(data?.sulphurEmail),
    };
  } catch {
    return { parisEmail: "", sulphurEmail: "" };
  }
}

export async function saveContactRoutingEmails(
  emails: Partial<ContactRoutingEmails>,
  updatedByUid: string,
): Promise<void> {
  await getFirestore()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOC)
    .set(
      {
        ...(emails.parisEmail !== undefined ? { parisEmail: emails.parisEmail.trim() } : {}),
        ...(emails.sulphurEmail !== undefined
          ? { sulphurEmail: emails.sulphurEmail.trim() }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid,
      },
      { merge: true },
    );
}

/**
 * Resolve the office notification recipient for a submission's location,
 * falling back to the global OFFICE_NOTIFICATION_EMAIL env var.
 */
export async function resolveOfficeNotificationEmail(
  location: ContactLocationId | undefined,
): Promise<string | null> {
  const fallback = process.env.OFFICE_NOTIFICATION_EMAIL?.trim() || "";
  const routing = await getContactRoutingEmails();
  const perLocation =
    location === "sulphur_springs"
      ? routing.sulphurEmail
      : location === "paris"
        ? routing.parisEmail
        : "";
  const to = perLocation || fallback;
  return to || null;
}
