import type { Firestore } from "firebase-admin/firestore";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientAcceptedEmail, patientPendingEmail } from "@/lib/email-templates";
import { buildIcs } from "@/lib/ics";
import { sendBookingNotification } from "@/lib/sendgrid";
import { siteUrl } from "@/lib/site-content";

/** Send patient email after staff creates a booking manually. */
export async function sendAdminCreatedBookingEmail(params: {
  db: Firestore;
  bookingId: string;
  status: "pending" | "confirmed";
  portalPlainToken?: string;
  isFirstVisit?: boolean;
}): Promise<void> {
  const snap = await params.db.collection("bookings").doc(params.bookingId).get();
  const emailCtx = bookingDocToEmailContext(snap);
  if (!emailCtx) return;

  const manageUrl = params.portalPlainToken
    ? siteUrl(`/book/manage?token=${encodeURIComponent(params.portalPlainToken)}`)
    : undefined;

  if (params.status === "confirmed") {
    const ics = buildIcs({
      uid: `${emailCtx.bookingId}@chiropracticparistexas.com`,
      startUtc: emailCtx.start.toUTC(),
      durationMinutes: emailCtx.durationMin,
      summary: `${emailCtx.serviceLine === "massage" ? "Massage" : "Chiropractic"} appointment`,
      description: `Confirmed appointment with ${emailCtx.providerDisplayName || "first available provider"}. Reference: ${emailCtx.bookingId}.`,
      location: `${emailCtx.locationId === "paris" ? "Paris" : "Sulphur Springs"}, TX`,
      organizerEmail: process.env.OFFICE_NOTIFICATION_EMAIL,
      organizerName: "Paris Wellness",
    });
    const { subject, text, html } = patientAcceptedEmail(
      { ...emailCtx, patientManageUrl: manageUrl },
      { isFirstVisit: params.isFirstVisit },
    );
    await sendBookingNotification({
      to: emailCtx.email,
      subject,
      text,
      html,
      attachments: [
        {
          filename: "appointment.ics",
          content: Buffer.from(ics, "utf8").toString("base64"),
          type: "text/calendar; method=PUBLISH",
        },
      ],
    });
    return;
  }

  const { subject, text, html } = patientPendingEmail(emailCtx, {
    isFirstVisit: params.isFirstVisit,
  });
  await sendBookingNotification({ to: emailCtx.email, subject, text, html });
}
