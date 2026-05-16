import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { recordBookingEventInTx } from "@/lib/booking-events";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientDeclinedEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";

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

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) {
        throw new Error("not_found");
      }
      const prev = snap.get("status");
      if (prev === "declined") {
        return;
      }
      if (prev !== "pending") {
        throw new Error("bad_status");
      }
      const bucketIds = snap.get("bucketIds") as string[] | undefined;
      if (bucketIds?.length) {
        for (const bid of bucketIds) {
          tx.delete(db.collection("slot_buckets").doc(bid));
        }
      }
      tx.update(bookingRef, {
        status: "declined",
        declinedAt: FieldValue.serverTimestamp(),
        declinedByUid: staff.uid,
        declinedByEmail: staff.email ?? null,
        patientPortalTokenHash: FieldValue.delete(),
        ...(reason ? { declineReason: reason } : {}),
      });
      recordBookingEventInTx(db, tx, id, {
        type: "declined",
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
        { error: "Only pending requests can be declined." },
        { status: 409 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Could not decline" }, { status: 500 });
  }

  try {
    const fresh = await bookingRef.get();
    const emailCtx = bookingDocToEmailContext(fresh);
    if (emailCtx) {
      const { subject, text, html } = patientDeclinedEmail(emailCtx, reason);
      await sendBookingNotification({
        to: emailCtx.email,
        subject,
        text,
        html,
        fromName: "The Rub Club & Chiropractic Associates",
      });
    }
  } catch (err) {
    console.error("Decline email failed", err);
  }

  return NextResponse.json({ ok: true });
}
