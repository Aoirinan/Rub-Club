import { DateTime } from "luxon";
import type { Firestore } from "firebase-admin/firestore";
import { TIME_ZONE } from "@/lib/constants";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import {
  officeRescheduleNotificationEmail,
  patientRescheduledEmail,
} from "@/lib/email-templates";
import { buildIcs } from "@/lib/ics";
import { emailLocations } from "@/lib/email-locations";
import { sendBookingNotification } from "@/lib/sendgrid";

/**
 * Whether SendGrid accepted the patient's email. `no_email`: nothing on file to
 * send to. `send_failed`: SendGrid is not configured, rejected the message, or
 * the booking is missing details the email needs.
 */
export type PatientRescheduleEmailResult =
  | { sent: true }
  | { sent: false; reason: "no_email" | "send_failed" };

export async function sendRescheduleNotifications(params: {
  db: Firestore;
  bookingId: string;
  prevStartIso: string;
  rescheduledBy: "patient" | "staff";
  notifyOffice?: boolean;
}): Promise<PatientRescheduleEmailResult> {
  const snap = await params.db.collection("bookings").doc(params.bookingId).get();
  if (!snap.exists) return { sent: false, reason: "send_failed" };

  const to = snap.get("email");
  if (typeof to !== "string" || !to.trim()) return { sent: false, reason: "no_email" };

  const emailCtx = bookingDocToEmailContext(snap);
  if (!emailCtx) return { sent: false, reason: "send_failed" };
  const locations = await emailLocations();

  const previousStart = DateTime.fromISO(params.prevStartIso, { zone: "utc" }).setZone(TIME_ZONE);
  if (!previousStart.isValid) return { sent: false, reason: "send_failed" };

  const status = snap.get("status");
  const isConfirmed = status === "confirmed";

  const { subject, text, html } = patientRescheduledEmail(
    emailCtx,
    { previousStart, rescheduledBy: params.rescheduledBy },
    locations,
  );

  const attachments = isConfirmed
    ? [
        {
          filename: "appointment.ics",
          content: Buffer.from(
            buildIcs({
              uid: `${emailCtx.bookingId}@chiropracticparistexas.com`,
              startUtc: emailCtx.start.toUTC(),
              durationMinutes: emailCtx.durationMin,
              summary: `${emailCtx.serviceLine === "massage" ? "Massage" : "Chiropractic"} appointment`,
              description: `Rescheduled appointment with ${emailCtx.providerDisplayName || "first available provider"}. Reference: ${emailCtx.bookingId}.`,
              location: `${locations[emailCtx.locationId].addressLocality}, ${locations[emailCtx.locationId].addressRegion}`,
              organizerEmail: process.env.OFFICE_NOTIFICATION_EMAIL,
              organizerName: "Paris Wellness",
              method: "REQUEST",
            }),
            "utf8",
          ).toString("base64"),
          type: "text/calendar; method=REQUEST",
        },
      ]
    : undefined;

  let patientSent = false;
  try {
    patientSent = await sendBookingNotification({
      to: emailCtx.email,
      subject,
      text,
      html,
      attachments,
    });
  } catch (err) {
    console.error("[reschedule] patient email failed", err);
  }

  if (params.notifyOffice) {
    const officeTo = process.env.OFFICE_NOTIFICATION_EMAIL?.trim();
    if (officeTo) {
      const officePayload = officeRescheduleNotificationEmail(emailCtx, { previousStart }, locations);
      try {
        await sendBookingNotification({
          to: officeTo,
          subject: officePayload.subject,
          text: officePayload.text,
          html: officePayload.html,
        });
      } catch (err) {
        console.error("[reschedule] office email failed", err);
      }
    }
  }

  return patientSent ? { sent: true } : { sent: false, reason: "send_failed" };
}
