import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { recordBookingEventInTx } from "@/lib/booking-events";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientCancelledEmail } from "@/lib/email-templates";
import { findBookingByPortalToken } from "@/lib/patient-portal-lookup";
import { assertRateLimitOk } from "@/lib/rate-limit";
import { sendBookingNotification } from "@/lib/sendgrid";

export const runtime = "nodejs";

const bodySchema = z.object({
  token: z.string().min(16).max(500),
  reason: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const rl = await assertRateLimitOk(req.headers);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again soon." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const reason = parsed.data.reason?.trim() || undefined;
  const db = getFirestore();
  const preSnap = await findBookingByPortalToken(db, parsed.data.token);
  if (!preSnap) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  const bookingId = preSnap.id;
  const bookingRef = preSnap.ref;

  let cancelledNow = false;
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) {
        throw new Error("not_found");
      }
      const prev = snap.get("status");
      if (prev === "cancelled") {
        return;
      }
      if (prev !== "confirmed") {
        throw new Error("bad_status");
      }
      const bucketIds = snap.get("bucketIds") as string[] | undefined;
      if (bucketIds?.length) {
        for (const bid of bucketIds) {
          tx.delete(db.collection("slot_buckets").doc(bid));
        }
      }
      tx.update(bookingRef, {
        status: "cancelled",
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledByUid: null,
        cancelledByEmail: "patient/portal",
        patientPortalTokenHash: FieldValue.delete(),
        ...(reason ? { cancelReason: reason } : {}),
      });
      recordBookingEventInTx(db, tx, bookingId, {
        type: "cancelled",
        byUid: null,
        byEmail: "patient/portal",
        ...(reason ? { reason } : {}),
        meta: { prevStatus: prev, via: "patient_portal" },
      });
      cancelledNow = true;
    });
  } catch (e) {
    if (e instanceof Error && e.message === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "bad_status") {
      return NextResponse.json({ error: "This appointment can no longer be cancelled online." }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Could not cancel" }, { status: 500 });
  }

  if (!cancelledNow) {
    return NextResponse.json({ ok: true });
  }

  try {
    const fresh = await bookingRef.get();
    const emailCtx = bookingDocToEmailContext(fresh);
    if (emailCtx) {
      const { subject, text, html } = patientCancelledEmail(emailCtx, reason, { viaPatientPortal: true });
      await sendBookingNotification({
        to: emailCtx.email,
        subject,
        text,
        html,
        fromName: "The Rub Club & Chiropractic Associates",
      });
    }
  } catch (err) {
    console.error("Patient cancel email failed", err);
  }

  return NextResponse.json({ ok: true });
}
