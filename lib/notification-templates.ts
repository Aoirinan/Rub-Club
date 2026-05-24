export type NotificationAudience = "customer" | "internal";
export type NotificationKind = "first_time" | "standard" | "status_change";
export type NotificationChannel = "sms" | "email";

export type SmsTemplateSet = Record<NotificationKind, string>;
export type EmailTemplateSet = Record<NotificationKind, { subject: string; body: string }>;

export type NotificationTemplatesConfig = {
  sms: Record<NotificationAudience, SmsTemplateSet>;
  email: Record<NotificationAudience, EmailTemplateSet>;
  rescheduleEmail: string;
};

export const NOTIFICATION_MERGE_FIELDS = [
  "AppointmentId",
  "CompanyName",
  "CompanyAddress",
  "CompanyPhone",
  "AppointmentSubject",
  "AppointmentDate",
  "AppointmentStartTime",
  "AppointmentEndTime",
  "Service",
  "ServiceProvider",
  "ResourceName",
  "CustomerFirstLastName",
  "AppointmentICSLink",
  "AppointmentConfirmation",
  "AppointmentConfirmReschedule",
  "AppointmentConfirmOnly",
] as const;

export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplatesConfig = {
  rescheduleEmail: "scheduling@chiropracticparistexas.com",
  sms: {
    customer: {
      first_time:
        "Hi [CustomerFirstLastName], your first visit with [ServiceProvider] for [Service] is on [AppointmentDate] at [AppointmentStartTime]. [AppointmentConfirmation]",
      standard:
        "[CustomerFirstLastName] has an appointment with [ServiceProvider] for [Service] on [AppointmentDate] at [AppointmentStartTime]. [AppointmentConfirmation]",
      status_change:
        "Update for [CustomerFirstLastName]: your [Service] appointment on [AppointmentDate] at [AppointmentStartTime] with [ServiceProvider] has changed. Call [CompanyPhone] with questions.",
    },
    internal: {
      first_time: "New patient [CustomerFirstLastName] — [Service] with [ServiceProvider] on [AppointmentDate] at [AppointmentStartTime].",
      standard:
        "Reminder: [CustomerFirstLastName] — [Service] with [ServiceProvider] on [AppointmentDate] at [AppointmentStartTime].",
      status_change:
        "Status change: [CustomerFirstLastName] — [Service] on [AppointmentDate] at [AppointmentStartTime].",
    },
  },
  email: {
    customer: {
      first_time: {
        subject: "Your appointment at [CompanyName]",
        body:
          "Hello [CustomerFirstLastName],\n\nYour first appointment for [Service] with [ServiceProvider] is scheduled for [AppointmentDate] at [AppointmentStartTime].\n\n[AppointmentConfirmation]\n\n[CompanyName]\n[CompanyAddress]\n[CompanyPhone]",
      },
      standard: {
        subject: "Appointment reminder — [AppointmentDate]",
        body:
          "Hello [CustomerFirstLastName],\n\nThis is a reminder for your [Service] appointment with [ServiceProvider] on [AppointmentDate] at [AppointmentStartTime].\n\n[AppointmentConfirmation]\n\n[CompanyName]",
      },
      status_change: {
        subject: "Appointment update — [CompanyName]",
        body:
          "Hello [CustomerFirstLastName],\n\nYour appointment on [AppointmentDate] at [AppointmentStartTime] has been updated.\n\nPlease call [CompanyPhone] if you need to make changes.",
      },
    },
    internal: {
      first_time: {
        subject: "New patient booking — [CustomerFirstLastName]",
        body: "[CustomerFirstLastName] booked [Service] with [ServiceProvider] on [AppointmentDate] at [AppointmentStartTime].",
      },
      standard: {
        subject: "Reminder batch — [CustomerFirstLastName]",
        body: "[CustomerFirstLastName]: [Service] on [AppointmentDate] at [AppointmentStartTime] with [ServiceProvider].",
      },
      status_change: {
        subject: "Booking status change",
        body: "[CustomerFirstLastName] — [Service] on [AppointmentDate] at [AppointmentStartTime].",
      },
    },
  },
};

export type MergeContext = Record<string, string>;

export function applyMergeTemplate(template: string, ctx: MergeContext): string {
  let out = template;
  for (const [key, value] of Object.entries(ctx)) {
    out = out.split(`[${key}]`).join(value);
  }
  return out;
}

export function buildReminderSmsBody(
  templates: NotificationTemplatesConfig,
  kind: NotificationKind,
  ctx: MergeContext,
): string {
  const raw = templates.sms.customer[kind] ?? templates.sms.customer.standard;
  return applyMergeTemplate(raw, ctx).trim();
}

export function resolveRescheduleEmail(config: NotificationTemplatesConfig): string {
  const fromEnv = process.env.RESCHEDULE_EMAIL?.trim();
  if (fromEnv && fromEnv.includes("@")) return fromEnv;
  return config.rescheduleEmail.trim() || DEFAULT_NOTIFICATION_TEMPLATES.rescheduleEmail;
}
