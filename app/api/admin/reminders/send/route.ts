import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientReminderEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { sendSms } from "@/lib/twilio";
import { recordBookingEvent } from "@/lib/booking-events";
import { formatChicagoDateTimeLong } from "@/lib/chicago-datetime-format";
import { LOCATIONS } from "@/lib/constants";
import { logSmsSent } from "@/lib/sms-audit";

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

    let emailSent = false;
    let smsSent = false;
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
      errors.push(`email-${docId}: ${err instanceof Error ? err.message : String(err)}`);
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
      if (smsSent) {
        await logSmsSent({
          phone: emailCtx.phone,
          message: smsBody,
          bookingId: docId,
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
