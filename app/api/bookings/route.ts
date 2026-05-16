import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue, Timestamp, type DocumentReference } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import type { DurationMin, LocationId, ServiceLine } from "@/lib/constants";
import { LOCATIONS, TIME_ZONE } from "@/lib/constants";
import { assertRateLimitOk, getClientIp } from "@/lib/rate-limit";
import {
  fetchActiveProvidersForService,
  orderProvidersForAnyBooking,
} from "@/lib/providers-db";
import { createPaymentLink } from "@/lib/square";
import { sendBookingNotification } from "@/lib/sendgrid";
import {
  bucketDocIdsForAppointment,
  holdBucketIdsForAppointment,
  isAlignedToSlotGrid,
  isWithinScheduleWindow,
  parseStartIsoToDateTime,
} from "@/lib/slots-luxon";
import {
  officeNotificationEmail,
  patientPendingEmail,
  type BookingEmailContext,
} from "@/lib/email-templates";
import { recordBookingEventInTx, recordBookingEvent } from "@/lib/booking-events";
import { resolvePublicBookingPrepayCents } from "@/lib/public-booking-prepay";
import { sendSms } from "@/lib/twilio";
import { logSmsSent } from "@/lib/sms-audit";
import { getSiteOrigin } from "@/lib/site-content";
import { linkBookingAfterCreate } from "@/lib/patients-db";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    locationId: z.enum(["paris", "sulphur_springs"]),
    serviceLine: z.enum(["massage", "chiropractic"]),
    visitKind: z.enum(["massage", "stretch"]).optional(),
    paymentType: z.enum(["cash", "insurance"]).optional(),
    durationMin: z.union([z.literal(30), z.literal(60)]),
    startIso: z.string().min(8),
    name: z.string().min(2).max(120),
    phone: z.string().min(7).max(40),
    email: z.string().email().max(200),
    notes: z.string().max(1200).optional(),
    website: z.string().max(200).optional(),
    providerMode: z.enum(["specific", "any"]),
    providerId: z.string().max(200).optional(),
    preferredProviderId: z.string().max(200).optional(),
    recurrence: z
      .object({
        frequency: z.enum(["weekly", "biweekly"]),
        count: z.number().int().min(2).max(8),
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.providerMode === "specific" && !val.providerId?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "providerId is required when providerMode is specific",
        path: ["providerId"],
      });
    }
    if (val.recurrence && val.providerMode !== "specific") {
      ctx.addIssue({
        code: "custom",
        message: "Recurrence is only available when you pick a specific provider.",
        path: ["recurrence"],
      });
    }
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

  if (body.serviceLine === "chiropractic") {
    return NextResponse.json(
      {
        error:
          "Chiropractic is not available for online booking. Insurance patients: please call Paris 903-785-5551 or Sulphur Springs 903-919-5020 to schedule.",
      },
      { status: 400 },
    );
  }

  if (body.paymentType === "insurance") {
    return NextResponse.json(
      {
        error:
          "Insurance patients please call us to book: Paris 903-785-5551 | Sulphur Springs 903-919-5020",
      },
      { status: 400 },
    );
  }

  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const start = parseStartIsoToDateTime(body.startIso);
  if (!start || !isAlignedToSlotGrid(start)) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }

  const intervalDays = body.recurrence?.frequency === "biweekly" ? 14 : 7;
  const occurrences = body.recurrence ? body.recurrence.count : 1;
  const starts: DateTime[] = [];
  for (let i = 0; i < occurrences; i++) {
    starts.push(start.plus({ days: i * intervalDays }));
  }

  const now = DateTime.now().setZone(TIME_ZONE);
  for (const t of starts) {
    if (t < now.plus({ minutes: 2 })) {
      return NextResponse.json({ error: "Start time is in the past" }, { status: 400 });
    }
    if (t > now.plus({ days: 90 })) {
      return NextResponse.json({ error: "Start time is too far out" }, { status: 400 });
    }
  }

  const locationId = body.locationId as LocationId;
  const durationMin = body.durationMin as DurationMin;
  const visitKind = body.visitKind === "stretch" ? "stretch" : "massage";
  /** Online booking is massage slots only (stretch uses the same schedule). */
  const serviceLine: ServiceLine = "massage";

  const db = getFirestore();
  const eligible = await fetchActiveProvidersForService(db, locationId, serviceLine, {
    publicBooking: true,
  });
  if (eligible.length === 0) {
    return NextResponse.json(
      {
        error:
          "Online booking is not available for this combination yet (no active providers). Please call the office.",
      },
      { status: 503 },
    );
  }

  const preferredProviderId = body.preferredProviderId?.trim() || undefined;

  let assignedProviderId: string;
  let assignedDisplayName: string;

  if (body.providerMode === "specific") {
    const providerId = body.providerId!.trim();
    const provider = eligible.find((p) => p.id === providerId);
    if (!provider) {
      return NextResponse.json(
        { error: "That provider is not available for this location and service." },
        { status: 400 },
      );
    }
    for (const t of starts) {
      if (!isWithinScheduleWindow(t, durationMin, provider.schedule ?? null)) {
        return NextResponse.json(
          { error: "One of the repeated visits falls outside that provider's bookable hours" },
          { status: 400 },
        );
      }
    }
    assignedProviderId = provider.id;
    assignedDisplayName = provider.displayName;
  } else {
    const canAny = eligible.some((p) =>
      isWithinScheduleWindow(start, durationMin, p.schedule ?? null),
    );
    if (!canAny) {
      return NextResponse.json({ error: "Outside bookable hours for this service" }, { status: 400 });
    }
    assignedProviderId = "";
    assignedDisplayName = "";
  }

  const createdIds: string[] = [];
  const conflicts: string[] = [];
  const multiVisit = starts.length > 1;

  for (let si = 0; si < starts.length; si++) {
    const thisStart = starts[si]!;
    const bookingRef = db.collection("bookings").doc();
    try {
      if (body.providerMode === "specific") {
        const bucketIds = bucketDocIdsForAppointment(
          locationId,
          assignedProviderId,
          thisStart,
          durationMin,
        );
        const holdIds = holdBucketIdsForAppointment(locationId, serviceLine, thisStart, durationMin);
        await db.runTransaction(async (tx) => {
          const bucketRefs = bucketIds.map((id) => db.collection("slot_buckets").doc(id));
          const holdRefs = holdIds.map((id) => db.collection("slot_buckets").doc(id));
          const snaps = await Promise.all(bucketRefs.map((r) => tx.get(r)));
          for (const s of snaps) {
            if (s.exists) throw new Error("slot_taken");
          }
          const holdSnaps = await Promise.all(holdRefs.map((r) => tx.get(r)));
          for (const s of holdSnaps) {
            if (s.exists) throw new Error("slot_taken");
          }
          const startAt = Timestamp.fromDate(thisStart.toUTC().toJSDate());
          for (const ref of bucketRefs) {
            tx.set(ref, {
              bookingId: bookingRef.id,
              locationId,
              providerId: assignedProviderId,
              serviceLine,
              durationMin,
              startIso: thisStart.toUTC().toISO(),
              createdAt: FieldValue.serverTimestamp(),
            });
          }
          tx.set(bookingRef, {
            locationId,
            serviceLine,
            durationMin,
            startIso: thisStart.toUTC().toISO(),
            startAt,
            bucketIds,
            providerMode: "specific",
            providerId: assignedProviderId,
            providerDisplayName: assignedDisplayName,
            ...(preferredProviderId && preferredProviderId !== assignedProviderId
              ? {
                  preferredProviderId,
                  preferredProviderDisplayName:
                    eligible.find((p) => p.id === preferredProviderId)?.displayName ?? "",
                }
              : {}),
            name: body.name.trim(),
            phone: body.phone.trim(),
            email: body.email.trim().toLowerCase(),
            notes: body.notes?.trim() || "",
            visitKind,
            paymentType: body.paymentType ?? "cash",
            status: "pending",
            sourceIp: getClientIp(req.headers),
            createdAt: FieldValue.serverTimestamp(),
            ...(body.recurrence
              ? {
                  recurrence: body.recurrence,
                  seriesIndex: si,
                  seriesSize: starts.length,
                }
              : {}),
          });
          recordBookingEventInTx(db, tx, bookingRef.id, {
            type: "created",
            byUid: null,
            byEmail: body.email.trim().toLowerCase(),
            meta: {
              via: "public_form",
              providerMode: "specific",
              ...(body.recurrence ? { recurrence: body.recurrence } : {}),
            },
          });
        });
      } else {
        const tryOrder = orderProvidersForAnyBooking(eligible, preferredProviderId);
        const holdIds = holdBucketIdsForAppointment(locationId, serviceLine, thisStart, durationMin);
        await db.runTransaction(async (tx) => {
          const holdRefs = holdIds.map((id) => db.collection("slot_buckets").doc(id));
          const holdSnaps = await Promise.all(holdRefs.map((r) => tx.get(r)));
          if (holdSnaps.some((s) => s.exists)) throw new Error("slot_taken");

          const bucketRefsByProvider: { id: string; name: string; refs: DocumentReference[] }[] = [];
          for (const p of tryOrder) {
            if (!isWithinScheduleWindow(thisStart, durationMin, p.schedule ?? null)) continue;
            const ids = bucketDocIdsForAppointment(locationId, p.id, thisStart, durationMin);
            const refs = ids.map((id) => db.collection("slot_buckets").doc(id));
            bucketRefsByProvider.push({ id: p.id, name: p.displayName, refs });
          }
          let picked: { id: string; name: string; refs: DocumentReference[] } | null = null;
          for (const row of bucketRefsByProvider) {
            const snaps = await Promise.all(row.refs.map((r) => tx.get(r)));
            if (!snaps.some((s) => s.exists)) {
              picked = row;
              break;
            }
          }
          if (!picked) throw new Error("slot_taken");

          assignedProviderId = picked.id;
          assignedDisplayName = picked.name;

          const bucketIds = bucketDocIdsForAppointment(locationId, assignedProviderId, thisStart, durationMin);
          const startAt = Timestamp.fromDate(thisStart.toUTC().toJSDate());

          for (const ref of picked.refs) {
            tx.set(ref, {
              bookingId: bookingRef.id,
              locationId,
              providerId: assignedProviderId,
              serviceLine,
              durationMin,
              startIso: thisStart.toUTC().toISO(),
              createdAt: FieldValue.serverTimestamp(),
            });
          }

          const prefRow = preferredProviderId
            ? eligible.find((p) => p.id === preferredProviderId)
            : undefined;

          tx.set(bookingRef, {
            locationId,
            serviceLine,
            durationMin,
            startIso: thisStart.toUTC().toISO(),
            startAt,
            bucketIds,
            providerMode: "any",
            providerId: assignedProviderId,
            providerDisplayName: assignedDisplayName,
            ...(preferredProviderId
              ? {
                  preferredProviderId,
                  preferredProviderDisplayName: prefRow?.displayName ?? "",
                }
              : {}),
            name: body.name.trim(),
            phone: body.phone.trim(),
            email: body.email.trim().toLowerCase(),
            notes: body.notes?.trim() || "",
            visitKind,
            paymentType: body.paymentType ?? "cash",
            status: "pending",
            sourceIp: getClientIp(req.headers),
            createdAt: FieldValue.serverTimestamp(),
          });
          recordBookingEventInTx(db, tx, bookingRef.id, {
            type: "created",
            byUid: null,
            byEmail: body.email.trim().toLowerCase(),
            meta: { via: "public_form", providerMode: "any" },
          });
        });
      }
      createdIds.push(bookingRef.id);
      await linkBookingAfterCreate(db, bookingRef.id, "online_booking").catch((err) =>
        console.error("[patients] link after public booking", err),
      );
    } catch (e) {
      if (e instanceof Error && e.message === "slot_taken") {
        if (multiVisit) {
          conflicts.push(thisStart.setZone(TIME_ZONE).toFormat("LLL d"));
          continue;
        }
        return NextResponse.json(
          { error: "That time was just taken. Pick another slot." },
          { status: 409 },
        );
      }
      console.error(e);
      return NextResponse.json({ error: "Could not complete booking" }, { status: 500 });
    }
  }

  if (createdIds.length === 0) {
    return NextResponse.json(
      {
        error: "No visits could be booked — those times were just taken.",
        conflicts,
      },
      { status: 409 },
    );
  }

  const preferredProviderName = preferredProviderId
    ? eligible.find((p) => p.id === preferredProviderId)?.displayName
    : undefined;

  const firstStart = starts[0]!;
  const emailContext: BookingEmailContext = {
    bookingId: createdIds[0]!,
    locationId,
    serviceLine,
    durationMin,
    start: firstStart,
    name: body.name.trim(),
    phone: body.phone.trim(),
    email: body.email.trim().toLowerCase(),
    notes: body.notes?.trim() || undefined,
    providerDisplayName: assignedDisplayName,
    providerMode: body.providerMode,
    preferredProviderName,
  };

  const recurrenceNote =
    createdIds.length > 1
      ? `We also received ${createdIds.length - 1} additional weekly visit(s) on the same weekday. Each is pending office confirmation (references: ${createdIds.slice(1).join(", ")}).`
      : undefined;

  const officeTo = process.env.OFFICE_NOTIFICATION_EMAIL;
  if (officeTo) {
    try {
      const officePayload = officeNotificationEmail(emailContext);
      let subject = officePayload.subject;
      let text = officePayload.text;
      const html = officePayload.html;
      if (createdIds.length > 1) {
        subject = `[${createdIds.length} visits] ${subject}`;
        text = `Patient requested ${createdIds.length} recurring visits (same weekday).\nBooking IDs: ${createdIds.join(", ")}\n\n${text}`;
      }
      await sendBookingNotification({
        to: officeTo,
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error("Office SendGrid failed", err);
    }
  } else {
    console.warn("[booking] OFFICE_NOTIFICATION_EMAIL is not set — skipping office notification");
  }

  try {
    const { subject, text, html } = patientPendingEmail(emailContext, { recurrenceNote });
    console.log("[booking] Sending patient confirmation to", emailContext.email);
    await sendBookingNotification({
      to: emailContext.email,
      subject,
      text,
      html,
      fromName: "The Rub Club & Chiropractic Associates",
    });
    console.log("[booking] Patient email send completed for", emailContext.email);
  } catch (err) {
    console.error("Patient SendGrid failed", err);
  }

  let paymentUrl: string | undefined;
  if (createdIds.length === 1 && !body.recurrence) {
    const cents = resolvePublicBookingPrepayCents(serviceLine, durationMin);
    if (cents !== null) {
      const primaryId = createdIds[0]!;
      const linkResult = await createPaymentLink({
        amountCents: cents,
        patientName: body.name.trim(),
        bookingId: primaryId,
        description: `${visitKind === "stretch" ? "Stretch" : "Massage"} · ${durationMin} min (online booking)`,
      });
      if (linkResult.created) {
        const ref = db.collection("bookings").doc(primaryId);
        await ref.update({
          paymentLinkUrl: linkResult.url,
          paymentLinkId: linkResult.paymentLinkId,
          paymentAmountCents: cents,
          paymentDescription: `${visitKind === "stretch" ? "Stretch" : "Massage"} · ${durationMin} min (online booking)`,
          paymentRequestedAt: FieldValue.serverTimestamp(),
          paymentRequestedByUid: null,
          prepaidOnline: true,
        });
        paymentUrl = linkResult.url;
        await recordBookingEvent(db, primaryId, {
          type: "payment_requested",
          byUid: null,
          byEmail: null,
          meta: {
            amountCents: cents,
            paymentLinkUrl: linkResult.url,
            paymentLinkId: linkResult.paymentLinkId,
            via: "public_prepay",
          },
        }).catch((e) => console.error("prepay event log failed", e));
      }
    }
  }

  const primaryId = createdIds[0]!;
  const confirmToken = randomBytes(18).toString("hex");
  await db.collection("bookings").doc(primaryId).update({ confirmToken });

  const origin = getSiteOrigin();
  const confirmUrl = `${origin}/api/confirm?token=${encodeURIComponent(confirmToken)}`;
  const locOffice = LOCATIONS[locationId];
  const firstName = body.name.trim().split(/\s+/)[0] || body.name.trim();
  const when = firstStart.setZone(TIME_ZONE).toFormat("LLLL d yyyy 'at' h:mm a");
  const biz = "The Rub Club";
  let smsBody = `Hi ${firstName}, your appointment at ${biz} is scheduled for ${when}. To cancel or reschedule, please call us at ${locOffice.phonePrimary}. Do not reply to this text. Confirm: ${confirmUrl}`;
  if (paymentUrl) {
    smsBody += ` Pay online: ${paymentUrl}`;
  } else {
    smsBody += ` A payment link may be texted separately once prepay is enabled for this visit type.`;
  }
  const smsResult = await sendSms(body.phone.trim(), smsBody.slice(0, 1550));
  if (smsResult.sent) {
    await logSmsSent({
      phone: body.phone.trim(),
      message: smsBody,
      bookingId: primaryId,
    }).catch(() => {});
  }

  return NextResponse.json(
    {
      ok: true,
      bookingId: createdIds[0],
      bookingIds: createdIds,
      status: "pending",
      providerId: assignedProviderId,
      providerDisplayName: assignedDisplayName,
      providerMode: body.providerMode,
      ...(conflicts.length > 0
        ? {
            conflicts,
            conflictsMessage: `Some dates were skipped (slot taken): ${conflicts.join(", ")}`,
          }
        : {}),
      totalCreated: createdIds.length,
      ...(paymentUrl ? { paymentUrl } : {}),
    },
    { status: 201 },
  );
}
