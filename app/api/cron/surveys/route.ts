import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { Timestamp, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { postVisitSurveyEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { recordBookingEvent } from "@/lib/booking-events";
import { TIME_ZONE } from "@/lib/constants";
import { emailLocations } from "@/lib/email-locations";
import { surveyStartAtWindow, surveyTiming } from "@/lib/survey-window";

export const runtime = "nodejs";

/**
 * Sends a short post-visit survey email for confirmed appointments whose end
 * time was 20+ minutes ago but within the last 7 days. At most one email per
 * booking (guarded by `survey_sent` events).
 *
 * The query covers only visits that can currently be in that window and pages
 * through all of them, so a busy week of already-surveyed visits can't crowd
 * out new ones.
 */
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

export async function GET(req: Request) {
  const denied = await authorizeCronRequest(req);
  if (denied) return denied;

  const db = getFirestore();
  const now = DateTime.now().setZone(TIME_ZONE);
  const nowMs = now.toMillis();
  const range = surveyStartAtWindow(nowMs);
  const startFrom = Timestamp.fromMillis(range.fromMs);
  const startBefore = Timestamp.fromMillis(range.beforeMs);

  let scanned = 0;
  let sent = 0;
  let skipped = 0;
  let truncated = false;
  const errors: string[] = [];
  let cursor: QueryDocumentSnapshot | null = null;

  for (let page = 0; ; page++) {
    if (page === MAX_PAGES) {
      truncated = true;
      break;
    }
    let query = db
      .collection("bookings")
      .where("status", "==", "confirmed")
      .where("startAt", ">=", startFrom)
      .where("startAt", "<", startBefore)
      .orderBy("startAt")
      .limit(PAGE_SIZE);
    if (cursor) query = query.startAfter(cursor);
    const snap = await query.get();
    scanned += snap.size;

    for (const doc of snap.docs) {
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
      if (surveyTiming(start.toMillis(), doc.get("durationMin"), nowMs) !== "eligible") {
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
        const { subject, text, html } = postVisitSurveyEmail(emailCtx, await emailLocations());
        const delivered = await sendBookingNotification({
          to: emailCtx.email,
          subject,
          text,
          html,
        });
        if (!delivered) {
          // Don't record survey_sent: leave the booking eligible for the next run.
          errors.push(`${doc.id}: email provider did not accept the message`);
          continue;
        }
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

    if (snap.size < PAGE_SIZE) break;
    cursor = snap.docs[snap.docs.length - 1]!;
  }

  return NextResponse.json({
    ok: true,
    scanned,
    sent,
    skipped,
    ...(truncated ? { truncated: true } : {}),
    errors: errors.length ? errors : undefined,
  });
}
