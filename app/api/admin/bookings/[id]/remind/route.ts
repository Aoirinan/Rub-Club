import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { recordBookingEvent } from "@/lib/booking-events";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientReminderEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { sendSms } from "@/lib/twilio";
import { formatChicagoDateTimeLong } from "@/lib/chicago-datetime-format";
import { LOCATIONS } from "@/lib/constants";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getFirestore();
  const bookingRef = db.collection("bookings").doc(id);
  const snap = await bookingRef.get();

  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status = snap.get("status");
  if (status !== "confirmed") {
    return NextResponse.json(
      { error: "Reminders can only be sent for confirmed appointments." },
      { status: 409 },
    );
  }

  const emailCtx = bookingDocToEmailContext(snap);
  if (!emailCtx) {
    return NextResponse.json(
      { error: "Booking is missing required fields for notifications." },
      { status: 422 },
    );
  }

  let emailSent = false;
  let smsSent = false;
  let smsDetail: string | undefined;

  try {
    const { subject, text, html } = patientReminderEmail(emailCtx);
    await sendBookingNotification({
      to: emailCtx.email,
      subject,
      text,
      html,
      fromName: "The Rub Club & Chiropractic Associates",
    });
    emailSent = true;
  } catch (err) {
    console.error("Reminder email failed:", err);
  }

  if (emailCtx.phone) {
    const loc = LOCATIONS[emailCtx.locationId];
    const smsBody = [
      `Reminder: Your ${emailCtx.serviceLine === "massage" ? "massage" : "chiropractic"} appointment is on ${formatChicagoDateTimeLong(emailCtx.start)}.`,
      `Provider: ${emailCtx.providerDisplayName || "First available"}`,
      `Location: ${loc.shortName} — ${loc.streetAddress}`,
      `To reschedule or cancel, call ${loc.phonePrimary}.`,
    ].join("\n");

    const result = await sendSms(emailCtx.phone, smsBody);
    smsSent = result.sent;
    if (!result.sent) smsDetail = result.detail;
  }

  await recordBookingEvent(db, id, {
    type: "reminder_sent",
    byUid: staff.uid,
    byEmail: staff.email ?? null,
    meta: { emailSent, smsSent },
  }).catch((err) => console.error("Failed to log reminder event:", err));

  return NextResponse.json({ ok: true, emailSent, smsSent, smsDetail });
}
