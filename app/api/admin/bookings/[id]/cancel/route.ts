import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { recordBookingEventInTx } from "@/lib/booking-events";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientCancelledEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { emailLocations } from "@/lib/email-locations";
import {
  linkBookingAfterCreate,
  onBookingStatusChange,
  recomputeNextAppointmentForBooking,
} from "@/lib/patients-db";

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
  let alreadyCancelled = false;

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) {
        throw new Error("not_found");
      }
      const prev = snap.get("status");
      prevStatus = typeof prev === "string" ? prev : undefined;
      if (prev === "cancelled") {
        alreadyCancelled = true;
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
        // Only release buckets this booking actually owns. Bookings created with
        // "allow double-booking" may list bucket ids that belong to another booking.
        const bucketRefs = bucketIds.map((bid) => db.collection("slot_buckets").doc(bid));
        const bucketSnaps = await Promise.all(bucketRefs.map((r) => tx.get(r)));
        for (const bs of bucketSnaps) {
          if (bs.exists && bs.get("bookingId") === id) tx.delete(bs.ref);
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

  if (alreadyCancelled) {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
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
    // Only email the patient if they previously saw a confirmation. prevStatus was
    // captured inside the transaction that performed this cancellation.
    if (emailCtx) {
      if (prevStatus === "confirmed") {
        const { subject, text, html } = patientCancelledEmail(emailCtx, reason, undefined, await emailLocations());
        await sendBookingNotification({
          to: emailCtx.email,
          subject,
          text,
          html,
        });
      }
    }
  } catch (err) {
    console.error("Cancel email failed", err);
  }

  await recomputeNextAppointmentForBooking(db, id).catch(() => {});

  return NextResponse.json({ ok: true });
}
