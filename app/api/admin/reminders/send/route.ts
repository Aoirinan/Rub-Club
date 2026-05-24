import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientReminderEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { sendSms } from "@/lib/twilio";
import { recordBookingEvent } from "@/lib/booking-events";
import { LOCATIONS } from "@/lib/constants";
import { logSmsSent } from "@/lib/sms-audit";
import { providerAllowsReminderChannel } from "@/lib/provider-reminders";
import { getNotificationTemplates } from "@/lib/notification-settings-db";
import { applyMergeTemplate, buildReminderSmsBody } from "@/lib/notification-templates";
import { logNotificationSent } from "@/lib/notifications-log";
import { serviceLineEmailLabel } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * Manual reminder send (staff). Does not run on a timer — matches the “Send Reminders”
 * workflow from the implementation script.
 */
export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getFirestore();
  const now = Date.now();
  const windowStart = Timestamp.fromMillis(now + 22 * 60 * 60 * 1000);
  const windowEnd = Timestamp.fromMillis(now + 26 * 60 * 60 * 1000);

  const snap = await db
    .collection("bookings")
    .where("status", "==", "confirmed")
    .where("startAt", ">=", windowStart)
    .where("startAt", "<=", windowEnd)
    .limit(200)
    .get();

  const byPhoneDay = new Map<string, { docId: string; startMs: number }>();
  for (const doc of snap.docs) {
    const data = doc.data();
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const startAt = data.startAt as Timestamp | undefined;
    if (!phone || !startAt) continue;
    const startMs = startAt.toMillis();
    const dayKey = new Date(startMs).toISOString().slice(0, 10);
    const digits = phone.replace(/\D/g, "").slice(-10);
    const key = `${digits}__${dayKey}`;
    const prev = byPhoneDay.get(key);
    if (!prev || startMs < prev.startMs) {
      byPhoneDay.set(key, { docId: doc.id, startMs });
    }
  }

  const templates = await getNotificationTemplates(db);
  let sent = 0;
  const errors: string[] = [];

  for (const { docId } of byPhoneDay.values()) {
    const doc = await db.collection("bookings").doc(docId).get();
    const events = await db
      .collection("bookings")
      .doc(docId)
      .collection("events")
      .where("type", "==", "reminder_sent")
      .limit(1)
      .get();
    if (!events.empty) continue;

    const emailCtx = bookingDocToEmailContext(doc);
    if (!emailCtx) continue;

    const providerId =
      typeof doc.get("providerId") === "string" ? (doc.get("providerId") as string) : "";
    const allowEmail = await providerAllowsReminderChannel(providerId, "email");
    const allowSms = await providerAllowsReminderChannel(providerId, "sms");
    if (!allowEmail && !allowSms) continue;

    const loc = LOCATIONS[emailCtx.locationId];
    const serviceName =
      typeof doc.get("serviceTypeName") === "string" && doc.get("serviceTypeName")
        ? String(doc.get("serviceTypeName"))
        : serviceLineEmailLabel(emailCtx.serviceLine);
    const mergeCtx = {
      AppointmentId: docId,
      CompanyName: loc.shortName,
      CompanyAddress: loc.streetAddress,
      CompanyPhone: loc.phonePrimary,
      AppointmentSubject: serviceName,
      AppointmentDate: emailCtx.start.toFormat("LLLL d, yyyy"),
      AppointmentStartTime: emailCtx.start.toFormat("h:mm a"),
      AppointmentEndTime: emailCtx.start.plus({ minutes: emailCtx.durationMin }).toFormat("h:mm a"),
      Service: serviceName,
      ServiceProvider: emailCtx.providerDisplayName || "First available",
      ResourceName: emailCtx.providerDisplayName || "",
      CustomerFirstLastName: emailCtx.name,
      AppointmentConfirmation: `To reschedule or cancel, call ${loc.phonePrimary}.`,
      AppointmentConfirmReschedule: "",
      AppointmentConfirmOnly: "",
      AppointmentICSLink: "",
    };

    let emailSent = false;
    let smsSent = false;
    let emailText = "";
    let emailSubject = "";
    try {
      if (allowEmail) {
        const emailTpl = templates.email.customer.standard;
        const customSubject = applyMergeTemplate(emailTpl.subject, mergeCtx).trim();
        const customBody = applyMergeTemplate(emailTpl.body, mergeCtx).trim();
        let subject: string;
        let text: string;
        let html: string;
        if (customSubject && customBody) {
          subject = customSubject;
          text = customBody;
          html = customBody
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .split("\n")
            .map((line) => `<p style="margin:0 0 1em;font-family:sans-serif;">${line || "&nbsp;"}</p>`)
            .join("");
        } else {
          const built = patientReminderEmail(emailCtx);
          subject = built.subject;
          text = built.text;
          html = built.html;
        }
        emailSubject = subject;
        emailText = text;
        await sendBookingNotification({
          to: emailCtx.email,
          subject,
          text,
          html,
        });
        emailSent = true;
        await logNotificationSent({
          type: "email",
          email: emailCtx.email,
          message: emailText,
          subject: emailSubject,
          bookingId: docId,
          patientId: typeof doc.get("patientId") === "string" ? doc.get("patientId") : null,
        }).catch(() => {});
      }
    } catch (err) {
      errors.push(`email-${docId}: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (emailCtx.phone && allowSms) {
      const smsBody =
        buildReminderSmsBody(templates, "standard", mergeCtx) ||
        applyMergeTemplate(templates.sms.customer.standard, mergeCtx);
      const result = await sendSms(emailCtx.phone, smsBody);
      smsSent = result.sent;
      if (smsSent) {
        await logSmsSent({
          phone: emailCtx.phone,
          message: smsBody,
          bookingId: docId,
        }).catch(() => {});
        await logNotificationSent({
          type: "sms",
          phone: emailCtx.phone,
          message: smsBody,
          bookingId: docId,
          patientId: typeof doc.get("patientId") === "string" ? doc.get("patientId") : null,
        }).catch(() => {});
      }
    }

    await recordBookingEvent(db, docId, {
      type: "reminder_sent",
      byUid: staff.uid,
      byEmail: staff.email ?? "staff/manual-reminder",
      meta: { emailSent, smsSent, automated: false, manual: true },
    }).catch(() => {});

    if (emailSent || smsSent) sent++;
  }

  return NextResponse.json({
    ok: true,
    candidates: byPhoneDay.size,
    sent,
    errors: errors.length ? errors : undefined,
  });
}
