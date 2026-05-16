import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { recordBookingEventInTx } from "@/lib/booking-events";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientCancelledEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { linkBookingAfterCreate, onBookingStatusChange } from "@/lib/patients-db";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .partial();

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsedBody: { reason?: string } = {};
  if (req.headers.get("content-length") && req.headers.get("content-length") !== "0") {
    try {
      const json = await req.json();
      const parsed = bodySchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      }
      parsedBody = parsed.data;
    } catch {
      // empty body is allowed
    }
  }
  const reason = parsedBody.reason?.trim() || undefined;

  const { id } = await ctx.params;
  const db = getFirestore();
  const bookingRef = db.collection("bookings").doc(id);
  let prevStatus: string | undefined;

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) {
        throw new Error("not_found");
      }
      const prev = snap.get("status");
      prevStatus = typeof prev === "string" ? prev : undefined;
      if (prev === "cancelled") {
        return;
      }
      // Cancelling a pending request is also allowed (acts like decline-without-email)
      // but the dedicated /decline route is preferred. We accept both confirmed and
      // pending here to be resilient — but only emit the cancellation email when the
      // booking was already confirmed (the patient was told it was confirmed before).
      if (prev !== "confirmed" && prev !== "pending") {
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
        cancelledByUid: staff.uid,
        cancelledByEmail: staff.email ?? null,
        patientPortalTokenHash: FieldValue.delete(),
        ...(reason ? { cancelReason: reason } : {}),
      });
      recordBookingEventInTx(db, tx, id, {
        type: "cancelled",
        byUid: staff.uid,
        byEmail: staff.email ?? null,
        ...(reason ? { reason } : {}),
        meta: { prevStatus: prev },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "bad_status") {
      return NextResponse.json(
        { error: "This booking can no longer be cancelled." },
        { status: 409 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Could not cancel" }, { status: 500 });
  }

  const freshCancel = await bookingRef.get();
  let cancelPatientId =
    typeof freshCancel.get("patientId") === "string" ? freshCancel.get("patientId") : null;
  if (!cancelPatientId) {
    await linkBookingAfterCreate(db, id, "manual").catch(() => {});
    const again = await bookingRef.get();
    cancelPatientId =
      typeof again.get("patientId") === "string" ? again.get("patientId") : null;
  }
  if (cancelPatientId) {
    await onBookingStatusChange(db, cancelPatientId, prevStatus, "cancelled").catch(() => {});
  }

  try {
    const fresh = freshCancel;
    const emailCtx = bookingDocToEmailContext(fresh);
    // Only email the patient if they previously saw a confirmation. The transaction
    // already updated the booking, so read prevStatus from the last event we wrote.
    if (emailCtx) {
      const lastEvent = await db
        .collection("bookings")
        .doc(id)
        .collection("events")
        .orderBy("at", "desc")
        .limit(1)
        .get();
      const prevStatus = lastEvent.docs[0]?.get("meta.prevStatus") as string | undefined;
      if (prevStatus === "confirmed") {
        const { subject, text, html } = patientCancelledEmail(emailCtx, reason);
        await sendBookingNotification({
          to: emailCtx.email,
          subject,
          text,
          html,
          fromName: "The Rub Club & Chiropractic Associates",
        });
      }
    }
  } catch (err) {
    console.error("Cancel email failed", err);
  }

  return NextResponse.json({ ok: true });
}
