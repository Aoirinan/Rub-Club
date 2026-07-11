import { DateTime } from "luxon";
import type { Firestore } from "firebase-admin/firestore";
import { TIME_ZONE } from "@/lib/constants";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import {
  officeRescheduleNotificationEmail,
  patientRescheduledEmail,
} from "@/lib/email-templates";
import { buildIcs } from "@/lib/ics";
import { sendBookingNotification } from "@/lib/sendgrid";

export async function sendRescheduleNotifications(params: {
  db: Firestore;
  bookingId: string;
  prevStartIso: string;
  rescheduledBy: "patient" | "staff";
  notifyOffice?: boolean;
}): Promise<void> {
  const snap = await params.db.collection("bookings").doc(params.bookingId).get();
  if (!snap.exists) return;

  const emailCtx = bookingDocToEmailContext(snap);
  if (!emailCtx) return;

  const previousStart = DateTime.fromISO(params.prevStartIso, { zone: "utc" }).setZone(TIME_ZONE);
  if (!previousStart.isValid) return;

  const status = snap.get("status");
  const isConfirmed = status === "confirmed";

  const { subject, text, html } = patientRescheduledEmail(emailCtx, {
    previousStart,
    rescheduledBy: params.rescheduledBy,
  });

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
              location: `${emailCtx.locationId === "paris" ? "Paris" : "Sulphur Springs"}, TX`,
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

  try {
    await sendBookingNotification({
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
      const officePayload = officeRescheduleNotificationEmail(emailCtx, { previousStart });
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
}
