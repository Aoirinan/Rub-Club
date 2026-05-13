import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import type { DurationMin, LocationId, ServiceLine } from "@/lib/constants";
import { TIME_ZONE } from "@/lib/constants";
import { assertRateLimitOk, getClientIp } from "@/lib/rate-limit";
import { sendBookingNotification } from "@/lib/sendgrid";
import {
  bucketDocIdsForAppointment,
  isAlignedToSlotGrid,
  isWithinBusinessWindow,
  parseStartIsoToDateTime,
} from "@/lib/slots-luxon";

export const runtime = "nodejs";

const bodySchema = z.object({
  locationId: z.enum(["paris", "sulphur_springs"]),
  serviceLine: z.enum(["massage", "chiropractic"]),
  durationMin: z.union([z.literal(30), z.literal(60)]),
  startIso: z.string().min(8),
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(40),
  email: z.string().email().max(200),
  notes: z.string().max(1200).optional(),
  website: z.string().max(200).optional(),
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
  const body = parsed.data;

  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const start = parseStartIsoToDateTime(body.startIso);
  if (!start || !isAlignedToSlotGrid(start)) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }
  if (!isWithinBusinessWindow(start, body.durationMin)) {
    return NextResponse.json({ error: "Outside business hours" }, { status: 400 });
  }

  const now = DateTime.now().setZone(TIME_ZONE);
  if (start < now.plus({ minutes: 2 })) {
    return NextResponse.json({ error: "Start time is in the past" }, { status: 400 });
  }
  if (start > now.plus({ days: 90 })) {
    return NextResponse.json({ error: "Start time is too far out" }, { status: 400 });
  }

  const locationId = body.locationId as LocationId;
  const durationMin = body.durationMin as DurationMin;
  const serviceLine = body.serviceLine as ServiceLine;
  const bucketIds = bucketDocIdsForAppointment(locationId, start, durationMin);

  const db = getFirestore();
  const bookingRef = db.collection("bookings").doc();

  try {
    await db.runTransaction(async (tx) => {
      const bucketRefs = bucketIds.map((id) => db.collection("slot_buckets").doc(id));
      const snaps = await Promise.all(bucketRefs.map((r) => tx.get(r)));
      for (const s of snaps) {
        if (s.exists) {
          throw new Error("slot_taken");
        }
      }

      const startAt = Timestamp.fromDate(start.toUTC().toJSDate());

      for (const ref of bucketRefs) {
        tx.set(ref, {
          bookingId: bookingRef.id,
          locationId,
          serviceLine,
          durationMin,
          startIso: start.toUTC().toISO(),
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      tx.set(bookingRef, {
        locationId,
        serviceLine,
        durationMin,
        startIso: start.toUTC().toISO(),
        startAt,
        bucketIds,
        name: body.name.trim(),
        phone: body.phone.trim(),
        email: body.email.trim().toLowerCase(),
        notes: body.notes?.trim() || "",
        status: "confirmed",
        sourceIp: getClientIp(req.headers),
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "slot_taken") {
      return NextResponse.json(
        { error: "That time was just taken. Pick another slot." },
        { status: 409 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Could not complete booking" }, { status: 500 });
  }

  const officeTo = process.env.OFFICE_NOTIFICATION_EMAIL;
  if (officeTo) {
    const text = [
      "New online booking request",
      `Booking ID: ${bookingRef.id}`,
      `When (Chicago): ${start.setZone(TIME_ZONE).toFormat("cccc, LLL d yyyy — h:mm a")} (${TIME_ZONE})`,
      `Duration: ${body.durationMin} minutes`,
      `Service: ${body.serviceLine}`,
      `Location: ${body.locationId}`,
      "",
      `Name: ${body.name}`,
      `Phone: ${body.phone}`,
      `Email: ${body.email}`,
      body.notes ? `Notes: ${body.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await sendBookingNotification({
        to: officeTo,
        subject: `New booking: ${body.serviceLine} @ ${start.setZone(TIME_ZONE).toFormat("LLL d h:mm a")}`,
        text,
      });
    } catch (err) {
      console.error("SendGrid failed", err);
    }
  }

  return NextResponse.json({ ok: true, bookingId: bookingRef.id }, { status: 201 });
}
