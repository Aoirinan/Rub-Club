import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { postVisitSurveyEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { recordBookingEvent } from "@/lib/booking-events";
import { TIME_ZONE } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * Sends a short post-visit survey email for confirmed appointments whose end
 * time was 20+ minutes ago but within the last 7 days. At most one email per
 * booking (guarded by `survey_sent` events).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  const isVercelProduction = process.env.VERCEL_ENV === "production";

  if (isVercelProduction) {
    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET must be set for production cron." },
        { status: 503 },
      );
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getFirestore();
  const now = DateTime.now().setZone(TIME_ZONE);
  const nowMs = now.toMillis();
  const pastFloor = Timestamp.fromMillis(nowMs - 8 * 24 * 60 * 60 * 1000);
  const beforeNow = Timestamp.fromMillis(nowMs);

  const snap = await db
    .collection("bookings")
    .where("status", "==", "confirmed")
    .where("startAt", ">=", pastFloor)
    .where("startAt", "<", beforeNow)
    .limit(120)
    .get();

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const doc of snap.docs) {
    const durationMin = doc.get("durationMin");
    if (durationMin !== 30 && durationMin !== 60) {
      skipped++;
      continue;
    }
    const startIso = doc.get("startIso");
    if (typeof startIso !== "string" || !startIso.length) {
      skipped++;
      continue;
    }
    const start = DateTime.fromISO(startIso, { zone: "utc" }).setZone(TIME_ZONE);
    if (!start.isValid) {
      skipped++;
      continue;
    }
    const endMs = start.plus({ minutes: durationMin }).toMillis();
    if (endMs > nowMs - 20 * 60 * 1000) {
      skipped++;
      continue;
    }
    if (endMs < nowMs - 7 * 24 * 60 * 60 * 1000) {
      skipped++;
      continue;
    }

    const prior = await db
      .collection("bookings")
      .doc(doc.id)
      .collection("events")
      .where("type", "==", "survey_sent")
      .limit(1)
      .get();
    if (!prior.empty) {
      skipped++;
      continue;
    }

    const emailCtx = bookingDocToEmailContext(doc);
    if (!emailCtx) {
      skipped++;
      continue;
    }

    try {
      const { subject, text, html } = postVisitSurveyEmail(emailCtx);
      await sendBookingNotification({
        to: emailCtx.email,
        subject,
        text,
        html,
        fromName: "The Rub Club & Chiropractic Associates",
      });
      await recordBookingEvent(db, doc.id, {
        type: "survey_sent",
        byUid: null,
        byEmail: "system/post-visit-survey",
        meta: { automated: true },
      });
      sent++;
    } catch (e) {
      errors.push(`${doc.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: snap.size,
    sent,
    skipped,
    errors: errors.length ? errors : undefined,
  });
}
