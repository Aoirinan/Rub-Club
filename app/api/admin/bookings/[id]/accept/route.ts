import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { recordBookingEventInTx } from "@/lib/booking-events";
import { bookingDocToEmailContext } from "@/lib/booking-doc";
import { patientAcceptedEmail } from "@/lib/email-templates";
import { sendBookingNotification } from "@/lib/sendgrid";
import { buildIcs } from "@/lib/ics";

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

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) {
        throw new Error("not_found");
      }
      const prev = snap.get("status");
      if (prev === "confirmed") {
        return;
      }
      if (prev !== "pending") {
        throw new Error("bad_status");
      }
      tx.update(bookingRef, {
        status: "confirmed",
        acceptedAt: FieldValue.serverTimestamp(),
        acceptedByUid: staff.uid,
        acceptedByEmail: staff.email ?? null,
      });
      recordBookingEventInTx(db, tx, id, {
        type: "accepted",
        byUid: staff.uid,
        byEmail: staff.email ?? null,
        meta: { prevStatus: prev },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "bad_status") {
      return NextResponse.json(
        { error: "Only pending requests can be accepted." },
        { status: 409 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Could not accept" }, { status: 500 });
  }

  try {
    const fresh = await bookingRef.get();
    const emailCtx = bookingDocToEmailContext(fresh);
    if (emailCtx) {
      const ics = buildIcs({
        uid: `${emailCtx.bookingId}@wellnessparistx`,
        startUtc: emailCtx.start.toUTC(),
        durationMinutes: emailCtx.durationMin,
        summary: `${emailCtx.serviceLine === "massage" ? "Massage" : "Chiropractic"} appointment`,
        description: `Confirmed appointment with ${emailCtx.providerDisplayName || "first available provider"}. Reference: ${emailCtx.bookingId}.`,
        location: `${emailCtx.locationId === "paris" ? "Paris" : "Sulphur Springs"}, TX`,
        organizerEmail: process.env.OFFICE_NOTIFICATION_EMAIL,
        organizerName: "Paris Wellness",
      });
      const icsBase64 = Buffer.from(ics, "utf8").toString("base64");

      const { subject, text, html } = patientAcceptedEmail(emailCtx);
      await sendBookingNotification({
        to: emailCtx.email,
        subject,
        text,
        html,
        fromName: "The Rub Club & Chiropractic Associates",
        attachments: [
          {
            filename: "appointment.ics",
            content: icsBase64,
            type: "text/calendar; method=PUBLISH",
          },
        ],
      });
    }
  } catch (err) {
    console.error("Accept email failed", err);
  }

  return NextResponse.json({ ok: true });
}
