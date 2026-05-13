import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import type { DurationMin, LocationId, ServiceLine } from "@/lib/constants";
import { TIME_ZONE } from "@/lib/constants";
import { requireStaff } from "@/lib/staff-auth";
import {
  bucketDocIdsForAppointment,
  isAlignedToSlotGrid,
  parseStartIsoToDateTime,
} from "@/lib/slots-luxon";
import { recordBookingEventInTx } from "@/lib/booking-events";

export const runtime = "nodejs";

const bodySchema = z.object({
  locationId: z.enum(["paris", "sulphur_springs"]),
  serviceLine: z.enum(["massage", "chiropractic"]),
  durationMin: z.union([z.literal(30), z.literal(60)]),
  startIso: z.string().min(8),
  providerId: z.string().min(1).max(200),
  providerDisplayName: z.string().min(1).max(200),
  name: z.string().min(2).max(120),
  phone: z.string().max(40).optional(),
  email: z.string().max(200).optional(),
  notes: z.string().max(1200).optional(),
  status: z.enum(["pending", "confirmed"]).optional(),
  skipConflictCheck: z.boolean().optional(),
});

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const start = parseStartIsoToDateTime(body.startIso);
  if (!start || !isAlignedToSlotGrid(start)) {
    return NextResponse.json({ error: "Invalid start time — must be on a 30-minute grid" }, { status: 400 });
  }

  const locationId = body.locationId as LocationId;
  const durationMin = body.durationMin as DurationMin;
  const serviceLine = body.serviceLine as ServiceLine;
  const status = body.status ?? "confirmed";

  const db = getFirestore();
  const bookingRef = db.collection("bookings").doc();

  try {
    const bucketIds = bucketDocIdsForAppointment(locationId, body.providerId, start, durationMin);

    await db.runTransaction(async (tx) => {
      if (!body.skipConflictCheck) {
        const bucketRefs = bucketIds.map((id) => db.collection("slot_buckets").doc(id));
        const snaps = await Promise.all(bucketRefs.map((r) => tx.get(r)));
        for (const s of snaps) {
          if (s.exists) throw new Error("slot_taken");
        }
        for (const ref of bucketRefs) {
          tx.set(ref, {
            bookingId: bookingRef.id,
            locationId,
            providerId: body.providerId,
            serviceLine,
            durationMin,
            startIso: start.toUTC().toISO(),
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }

      const startAt = Timestamp.fromDate(start.toUTC().toJSDate());

      tx.set(bookingRef, {
        locationId,
        serviceLine,
        durationMin,
        startIso: start.toUTC().toISO(),
        startAt,
        bucketIds,
        providerMode: "specific",
        providerId: body.providerId,
        providerDisplayName: body.providerDisplayName,
        name: body.name.trim(),
        phone: body.phone?.trim() || "",
        email: body.email?.trim().toLowerCase() || "",
        notes: body.notes?.trim() || "",
        status,
        ...(status === "confirmed"
          ? {
              acceptedByUid: staff.uid,
              acceptedByEmail: staff.email ?? null,
              acceptedAt: FieldValue.serverTimestamp(),
            }
          : {}),
        createdAt: FieldValue.serverTimestamp(),
      });

      recordBookingEventInTx(db, tx, bookingRef.id, {
        type: "created",
        byUid: staff.uid,
        byEmail: staff.email ?? null,
        meta: { via: "admin_manual" },
      });

      if (status === "confirmed") {
        recordBookingEventInTx(db, tx, bookingRef.id, {
          type: "accepted",
          byUid: staff.uid,
          byEmail: staff.email ?? null,
          meta: { via: "admin_manual", autoConfirmed: true },
        });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "slot_taken") {
      return NextResponse.json(
        { error: "That time slot is already taken by another appointment." },
        { status: 409 },
      );
    }
    console.error("[admin/bookings/create]", e);
    return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      bookingId: bookingRef.id,
      status,
    },
    { status: 201 },
  );
}
