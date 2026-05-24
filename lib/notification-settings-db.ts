import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  type NotificationTemplatesConfig,
} from "./notification-templates";

const DOC_PATH = "site_config/notifications";

function deepMergeTemplates(
  base: NotificationTemplatesConfig,
  raw: Record<string, unknown> | undefined,
): NotificationTemplatesConfig {
  if (!raw) return base;
  const out = structuredClone(base);
  if (typeof raw.rescheduleEmail === "string" && raw.rescheduleEmail.trim()) {
    out.rescheduleEmail = raw.rescheduleEmail.trim();
  }
  for (const channel of ["sms", "email"] as const) {
    const chRaw = raw[channel];
    if (!chRaw || typeof chRaw !== "object") continue;
    for (const audience of ["customer", "internal"] as const) {
      const audRaw = (chRaw as Record<string, unknown>)[audience];
      if (!audRaw || typeof audRaw !== "object") continue;
      for (const kind of ["first_time", "standard", "status_change"] as const) {
        const kRaw = (audRaw as Record<string, unknown>)[kind];
        if (channel === "sms" && typeof kRaw === "string") {
          out.sms[audience][kind] = kRaw;
        }
        if (channel === "email" && kRaw && typeof kRaw === "object") {
          const sub = kRaw as { subject?: unknown; body?: unknown };
          if (typeof sub.subject === "string") out.email[audience][kind].subject = sub.subject;
          if (typeof sub.body === "string") out.email[audience][kind].body = sub.body;
        }
      }
    }
  }
  return out;
}

export async function getNotificationTemplates(
  db: Firestore,
): Promise<NotificationTemplatesConfig> {
  const snap = await db.doc(DOC_PATH).get();
  if (!snap.exists) return DEFAULT_NOTIFICATION_TEMPLATES;
  return deepMergeTemplates(DEFAULT_NOTIFICATION_TEMPLATES, snap.data());
}

export async function saveNotificationTemplates(
  db: Firestore,
  patch: Partial<NotificationTemplatesConfig>,
  updatedByUid: string,
): Promise<void> {
  await db.doc(DOC_PATH).set(
    {
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
      updatedByUid,
    },
    { merge: true },
  );
}
