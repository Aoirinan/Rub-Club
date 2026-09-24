import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  type NotificationTemplatesConfig,
} from "./notification-templates";

const DOC_PATH = "site_config/notifications";

/*
 * The fields `deepMergeTemplates` reads, and nothing else, so a save can't
 * park arbitrary data in the settings doc. Every level is optional (a save may
 * send one channel or one message) and unknown keys are dropped.
 */
const smsText = z.string().max(2000);
const smsSetSchema = z.object({
  first_time: smsText.optional(),
  standard: smsText.optional(),
  status_change: smsText.optional(),
});
const emailTemplateSchema = z.object({
  subject: z.string().max(500).optional(),
  body: z.string().max(20000).optional(),
});
const emailSetSchema = z.object({
  first_time: emailTemplateSchema.optional(),
  standard: emailTemplateSchema.optional(),
  status_change: emailTemplateSchema.optional(),
});

export const notificationTemplatesPatchSchema = z.object({
  rescheduleEmail: z.string().trim().email().max(200).optional(),
  sms: z
    .object({ customer: smsSetSchema.optional(), internal: smsSetSchema.optional() })
    .optional(),
  email: z
    .object({ customer: emailSetSchema.optional(), internal: emailSetSchema.optional() })
    .optional(),
});

export type NotificationTemplatesPatch = z.infer<typeof notificationTemplatesPatchSchema>;

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

/**
 * Validate a settings save. Returns null for anything that doesn't match the
 * template shape; what is returned holds only known fields.
 */
export function parseNotificationTemplatesPatch(raw: unknown): NotificationTemplatesPatch | null {
  const parsed = notificationTemplatesPatchSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function saveNotificationTemplates(
  db: Firestore,
  patch: NotificationTemplatesPatch,
  updatedByUid: string,
): Promise<void> {
  // Re-validated here too, so no caller can write fields the reader ignores.
  const clean = parseNotificationTemplatesPatch(patch);
  if (!clean) throw new Error("Invalid notification settings");
  await db.doc(DOC_PATH).set(
    {
      ...clean,
      updatedAt: FieldValue.serverTimestamp(),
      updatedByUid,
    },
    { merge: true },
  );
}
