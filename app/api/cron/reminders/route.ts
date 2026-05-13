import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientReminderEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { sendSms } from "@/lib/twilio";
import { recordBookingEvent } from "@/lib/booking-events";
import { formatChicagoDateTimeLong } from "@/lib/chicago-datetime-format";
import { LOCATIONS } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * Automated reminder cron — sends reminders for confirmed appointments
 * starting between 18 and 42 hours from now (fits a once-daily schedule on
 * Vercel Hobby). On Pro you can run hourly and tighten the window in code.
 *
 * Protected by CRON_SECRET env var when set.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getFirestore();
  const now = Date.now();
  const windowStart = Timestamp.fromMillis(now + 18 * 60 * 60 * 1000);
  const windowEnd = Timestamp.fromMillis(now + 42 * 60 * 60 * 1000);

  const snap = await db
    .collection("bookings")
    .where("status", "==", "confirmed")
    .where("startAt", ">=", windowStart)
    .where("startAt", "<=", windowEnd)
    .limit(200)
    .get();

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const doc of snap.docs) {
    const events = await db
      .collection("bookings")
      .doc(doc.id)
      .collection("events")
      .where("type", "==", "reminder_sent")
      .limit(1)
      .get();

    if (!events.empty) {
      skipped++;
      continue;
    }

    const emailCtx = bookingDocToEmailContext(doc);
    if (!emailCtx) {
      skipped++;
      continue;
    }

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
      errors.push(`email-${doc.id}: ${err instanceof Error ? err.message : String(err)}`);
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
    }

    await recordBookingEvent(db, doc.id, {
      type: "reminder_sent",
      byUid: null,
      byEmail: "system/auto-reminder",
      meta: { emailSent, smsSent, automated: true },
    }).catch(() => {});

    if (emailSent || smsSent) sent++;
  }

  return NextResponse.json({
    ok: true,
    total: snap.size,
    sent,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
