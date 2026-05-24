import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import type { LocationId, ServiceLine } from "@/lib/constants";
import { LOCATIONS, TIME_ZONE } from "@/lib/constants";
import { requireStaff } from "@/lib/staff-auth";
import { isAlignedToSlotGrid, parseStartIsoToDateTime } from "@/lib/slots-luxon";
import { insertAdminBookingInTransaction } from "@/lib/admin-booking-insert";
import { fetchSchedulerServiceById } from "@/lib/scheduler-services-db";
import { isPatientBusinessTag, mergePatientBusinessTag } from "@/lib/patient-business";
import { linkBookingAfterCreate } from "@/lib/patients-db";
import { sendSms } from "@/lib/twilio";
import { logSmsSent } from "@/lib/sms-audit";
import { getSiteOrigin } from "@/lib/site-content";

export const runtime = "nodejs";

const bodySchema = z.object({
  locationId: z.enum(["paris", "sulphur_springs"]),
  serviceLine: z.enum(["massage", "chiropractic", "stretch"]),
  durationMin: z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(120)]).optional(),
  schedulerServiceId: z.string().max(200).optional(),
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
  sendFirstTimeNotification: z.boolean().optional(),
  patientBusinessTag: z.enum(["rub_club", "chiro", "both"]).optional(),
});

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
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
  const serviceLine = body.serviceLine as ServiceLine;
  const status = body.status ?? "confirmed";

  const db = getFirestore();
  let durationMin: number | undefined = body.durationMin;
  let schedulerServiceId: string | undefined;
  let serviceTypeName: string | undefined;
  let bufferBeforeMinutes = 0;
  let bufferAfterMinutes = 0;
  if (body.schedulerServiceId?.trim()) {
    const svc = await fetchSchedulerServiceById(db, body.schedulerServiceId.trim());
    if (!svc || !svc.active) {
      return NextResponse.json({ error: "Unknown service type" }, { status: 400 });
    }
    schedulerServiceId = svc.id;
    serviceTypeName = svc.name;
    durationMin = svc.durationMinutes;
    bufferBeforeMinutes = svc.bufferBeforeMinutes;
    bufferAfterMinutes = svc.bufferAfterMinutes;
  }
  if (!durationMin) {
    return NextResponse.json({ error: "Duration or service type required" }, { status: 400 });
  }

  const intervalDays = body.recurrence?.frequency === "biweekly" ? 14 : 7;
  const occurrences = body.recurrence?.count ?? 1;

  const starts: DateTime[] = [];
  for (let i = 0; i < occurrences; i++) {
    starts.push(start.plus({ days: i * intervalDays }));
  }

  const seriesId = occurrences > 1 ? `series_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : undefined;

  const createdIds: string[] = [];
  const conflicts: string[] = [];

  const staffActor = { uid: staff.uid, email: staff.email ?? null };

  for (const thisStart of starts) {
    const bookingRef = db.collection("bookings").doc();

    try {
      const result = await insertAdminBookingInTransaction(db, bookingRef, {
        start: thisStart,
        locationId,
        serviceLine,
        durationMin,
        providerId: body.providerId,
        providerDisplayName: body.providerDisplayName,
        name: body.name,
        phone: body.phone?.trim() || "",
        email: body.email?.trim().toLowerCase() || "",
        notes: body.notes?.trim() || "",
        status,
        skipConflictCheck: body.skipConflictCheck ?? false,
        staff: staffActor,
        createMetaVia: "admin_manual",
        schedulerServiceId,
        serviceTypeName: serviceTypeName ?? undefined,
        bufferBeforeMinutes,
        bufferAfterMinutes,
        ...(seriesId ? { seriesId, recurrence: body.recurrence } : {}),
      });

      if (result === "ok") {
        createdIds.push(bookingRef.id);
        await linkBookingAfterCreate(db, bookingRef.id, "manual").catch((e) =>
          console.error("[patients] link after admin create", e),
        );
        if (body.patientBusinessTag && bookingRef.id) {
          const bSnap = await bookingRef.get();
          const pid = bSnap.get("patientId");
          if (typeof pid === "string" && pid) {
            const pref = db.collection("patients").doc(pid);
            const pSnap = await pref.get();
            if (pSnap.exists) {
              const cur = pSnap.get("businessTag");
              const tag =
                body.patientBusinessTag === "both"
                  ? "both"
                  : mergePatientBusinessTag(
                      isPatientBusinessTag(cur) ? cur : undefined,
                      body.patientBusinessTag,
                    );
              await pref.update({ businessTag: tag });
            }
          }
        }
        continue;
      }

      if (result === "slot_taken" || result === "slot_blocked") {
        const dateLabel = thisStart.setZone(TIME_ZONE).toFormat("LLL d");
        conflicts.push(dateLabel);
        if (occurrences === 1) {
          return NextResponse.json(
            {
              error:
                result === "slot_taken"
                  ? "That time slot is already taken by another appointment."
                  : "That time is blocked by an admin hold. Remove the matching hold first (Scheduler → Block tray), or enable 'Allow double-booking' to override.",
            },
            { status: 409 },
          );
        }
        continue;
      }
    } catch (e) {
      console.error("[admin/bookings/create]", e);
      return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
    }
  }

  if (createdIds.length > 0 && body.phone?.trim() && body.sendFirstTimeNotification !== false) {
    const phone = body.phone.trim();
    const primaryId = createdIds[0]!;
    const confirmToken = randomBytes(18).toString("hex");
    await db.collection("bookings").doc(primaryId).update({ confirmToken });
    const origin = getSiteOrigin();
    const confirmUrl = `${origin}/api/confirm?token=${encodeURIComponent(confirmToken)}`;
    const locOffice = LOCATIONS[locationId];
    const firstName = body.name.trim().split(/\s+/)[0] || body.name.trim();
    const when = starts[0]!.setZone(TIME_ZONE).toFormat("LLLL d yyyy 'at' h:mm a");
    const biz = "The Rub Club";
    const smsBody = `Hi ${firstName}, your appointment at ${biz} is scheduled for ${when}. To cancel or reschedule, please call us at ${locOffice.phonePrimary}. Do not reply to this text. Confirm: ${confirmUrl}`.slice(
      0,
      1550,
    );
    const smsResult = await sendSms(phone, smsBody);
    if (smsResult.sent) {
      await logSmsSent({ phone, message: smsBody, bookingId: primaryId }).catch(() => {});
    }
  }

  return NextResponse.json(
    {
      ok: true,
      bookingId: createdIds[0],
      bookingIds: createdIds,
      status,
      ...(seriesId ? { seriesId } : {}),
      ...(conflicts.length > 0
        ? {
            conflicts,
            conflictsMessage: `Skipped ${conflicts.length} date(s) due to conflicts: ${conflicts.join(", ")}`,
          }
        : {}),
      totalCreated: createdIds.length,
    },
    { status: 201 },
  );
}
