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
  holdBucketIdsForAppointment,
  isAlignedToSlotGrid,
  parseStartIsoToDateTime,
} from "@/lib/slots-luxon";
import { recordBookingEventInTx } from "@/lib/booking-events";
import { generatePatientPortalToken, hashPatientPortalToken } from "@/lib/patient-portal-token";

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
  recurrence: z.object({
    frequency: z.enum(["weekly", "biweekly"]),
    count: z.number().int().min(2).max(26),
  }).optional(),
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

  const intervalDays = body.recurrence?.frequency === "biweekly" ? 14 : 7;
  const occurrences = body.recurrence?.count ?? 1;

  const starts: DateTime[] = [];
  for (let i = 0; i < occurrences; i++) {
    starts.push(start.plus({ days: i * intervalDays }));
  }

  const seriesId = occurrences > 1 ? `series_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : undefined;

  const db = getFirestore();
  const createdIds: string[] = [];
  const conflicts: string[] = [];

  for (const thisStart of starts) {
    const bookingRef = db.collection("bookings").doc();
    const portalHash =
      status === "confirmed" ? hashPatientPortalToken(generatePatientPortalToken()) : "";

    try {
      const bucketIds = bucketDocIdsForAppointment(locationId, body.providerId, thisStart, durationMin);

      await db.runTransaction(async (tx) => {
        if (!body.skipConflictCheck) {
          const providerBucketRefs = bucketIds.map((id) => db.collection("slot_buckets").doc(id));
          const holdIds = holdBucketIdsForAppointment(locationId, serviceLine, thisStart, durationMin);
          const holdRefs = holdIds.map((id) => db.collection("slot_buckets").doc(id));

          const providerSnaps = await Promise.all(providerBucketRefs.map((r) => tx.get(r)));
          for (const s of providerSnaps) {
            if (s.exists) throw new Error("slot_taken");
          }
          const holdSnaps = await Promise.all(holdRefs.map((r) => tx.get(r)));
          for (const s of holdSnaps) {
            if (s.exists) throw new Error("slot_blocked");
          }

          for (const ref of providerBucketRefs) {
            tx.set(ref, {
              bookingId: bookingRef.id,
              locationId,
              providerId: body.providerId,
              serviceLine,
              durationMin,
              startIso: thisStart.toUTC().toISO(),
              createdAt: FieldValue.serverTimestamp(),
            });
          }
        }

        const startAt = Timestamp.fromDate(thisStart.toUTC().toJSDate());

        tx.set(bookingRef, {
          locationId,
          serviceLine,
          durationMin,
          startIso: thisStart.toUTC().toISO(),
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
          ...(seriesId ? { seriesId, recurrence: body.recurrence } : {}),
          ...(status === "confirmed"
            ? {
                acceptedByUid: staff.uid,
                acceptedByEmail: staff.email ?? null,
                acceptedAt: FieldValue.serverTimestamp(),
                ...(portalHash ? { patientPortalTokenHash: portalHash } : {}),
              }
            : {}),
          createdAt: FieldValue.serverTimestamp(),
        });

        recordBookingEventInTx(db, tx, bookingRef.id, {
          type: "created",
          byUid: staff.uid,
          byEmail: staff.email ?? null,
          meta: {
            via: "admin_manual",
            ...(seriesId ? { seriesId, recurrence: body.recurrence } : {}),
          },
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

      createdIds.push(bookingRef.id);
    } catch (e) {
      if (e instanceof Error && (e.message === "slot_taken" || e.message === "slot_blocked")) {
        const dateLabel = thisStart.setZone(TIME_ZONE).toFormat("LLL d");
        conflicts.push(dateLabel);
        if (occurrences === 1) {
          return NextResponse.json(
            {
              error: e.message === "slot_taken"
                ? "That time slot is already taken by another appointment."
                : "That time is blocked by an admin hold. Remove the matching hold first (Scheduler → Block tray), or enable 'Allow double-booking' to override.",
            },
            { status: 409 },
          );
        }
        continue;
      }
      console.error("[admin/bookings/create]", e);
      return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
    }
  }

  return NextResponse.json(
    {
      ok: true,
      bookingId: createdIds[0],
      bookingIds: createdIds,
      status,
      ...(seriesId ? { seriesId } : {}),
      ...(conflicts.length > 0 ? { conflicts, conflictsMessage: `Skipped ${conflicts.length} date(s) due to conflicts: ${conflicts.join(", ")}` } : {}),
      totalCreated: createdIds.length,
    },
    { status: 201 },
  );
}
