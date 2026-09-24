import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue, Timestamp, type DocumentReference } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import type { LocationId, ServiceLine } from "@/lib/constants";
import { isValidCatalogDurationMin, isValidPublicBookingDurationMin } from "@/lib/booking-duration";
import {
  BOOKING_REQUESTS_COLLECTION,
  bookingRequestFingerprint,
  readBookingRequestInTx,
  replayFromBookingRequest,
  writeBookingRequestInTx,
  isValidBookingRequestId,
} from "@/lib/booking-request-idempotency";
import { fetchSchedulerServiceById } from "@/lib/scheduler-services-db";
import { isCustomerVisibleService, schedulerServiceMatchesLine } from "@/lib/scheduler-service-lines";
import { TIME_ZONE, serviceLineEmailLabel } from "@/lib/constants";
import { emailLocations } from "@/lib/email-locations";
import { assertRateLimitOk, getClientIp } from "@/lib/rate-limit";
import {
  fetchActiveProvidersForPublicBooking,
  orderProvidersForAnyBooking,
} from "@/lib/providers-db";
import { providerAllowsAppointmentTime } from "@/lib/provider-scheduling";
import type { ProviderRow } from "@/lib/provider-types";
import { createPaymentLink } from "@/lib/square";
import { sendBookingNotification } from "@/lib/sendgrid";
import {
  bucketDocIdsForAppointment,
  holdBucketIdsForPublicBooking,
  isAlignedToSlotGrid,
  otherOfficeBucketIdsForAppointment,
  parseStartIsoToDateTime,
} from "@/lib/slots-luxon";
import {
  officeNotificationEmail,
  patientPendingEmail,
  type BookingEmailContext,
} from "@/lib/email-templates";
import { recordBookingEventInTx, recordBookingEvent } from "@/lib/booking-events";
import { officeSeriesLines, patientSeriesNote } from "@/lib/booking-series-notes";
import { resolvePublicBookingPrepayCents } from "@/lib/public-booking-prepay";
import { sendSms } from "@/lib/twilio";
import { logSmsSent } from "@/lib/sms-audit";
import { getSiteOrigin } from "@/lib/site-content";
import { linkBookingAfterCreate } from "@/lib/patients-db";
import { getPublicBookingConfig, isPublicBookingEnabled } from "@/lib/public-booking-settings";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    locationId: z.enum(["paris", "sulphur_springs"]),
    serviceLine: z.enum(["massage", "chiropractic", "stretch"]),
    visitKind: z.enum(["massage", "stretch", "chiropractic"]).optional(),
    paymentType: z.enum(["cash", "insurance"]).optional(),
    // Narrowed after the service lookup: a catalog service's own length, else 30-minute steps.
    durationMin: z.number().int().refine(isValidCatalogDurationMin, "Invalid duration"),
    schedulerServiceId: z.string().max(200).optional(),
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
    /** Random id per submit attempt; a retry of the same form reuses it. */
    requestId: z.string().refine(isValidBookingRequestId, "Invalid requestId").optional(),
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
  const rl = await assertRateLimitOk(req.headers, { bucket: "booking" });
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

  const db = getFirestore();

  // A resubmit of a request that already booked (the first response was lost)
  // gets the original confirmation back instead of booking again. Checked
  // before anything that may have changed since, like the booking switch or the
  // start time now being too close.
  const requestRef = body.requestId
    ? db.collection(BOOKING_REQUESTS_COLLECTION).doc(body.requestId)
    : null;
  const requestFingerprint = bookingRequestFingerprint({
    locationId: body.locationId,
    serviceLine: body.serviceLine,
    durationMin: body.durationMin,
    schedulerServiceId: body.schedulerServiceId,
    startIso: body.startIso,
    email: body.email,
    providerMode: body.providerMode,
    providerId: body.providerId,
    recurrence: body.recurrence,
  });
  // Tells this submit's own series visits apart from an earlier submit's.
  const requestAttempt = randomBytes(12).toString("hex");
  if (requestRef) {
    const prior = await requestRef.get();
    const replay = replayFromBookingRequest(prior.exists ? prior.data() : undefined, requestFingerprint);
    if (replay.kind === "replay") return NextResponse.json(replay.body, { status: 201 });
    if (replay.kind === "mismatch") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  }

  const publicBooking = await getPublicBookingConfig();
  if (!isPublicBookingEnabled(publicBooking)) {
    return NextResponse.json(
      { error: publicBooking.disabledMessage },
      { status: 503 },
    );
  }

  if (body.paymentType === "insurance") {
    const locs = await emailLocations();
    return NextResponse.json(
      {
        error: `Insurance patients please call us to book: Paris ${locs.paris.phonePrimary} | Sulphur Springs ${locs.sulphur_springs.phonePrimary}`,
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
  }
  // Only the first visit must fall inside the booking window; later occurrences
  // of a weekly series are allowed to run past it.
  if (start > now.plus({ days: 90 })) {
    return NextResponse.json({ error: "Start time is too far out" }, { status: 400 });
  }

  const locationId = body.locationId as LocationId;
  const serviceLine = body.serviceLine as ServiceLine;
  const visitKind: "massage" | "stretch" | "chiropractic" =
    serviceLine === "stretch" || body.visitKind === "stretch"
      ? "stretch"
      : serviceLine === "chiropractic"
        ? "chiropractic"
        : "massage";

  const durationMin = body.durationMin;
  let schedulerServiceId: string | undefined;
  let serviceTypeName: string | undefined;
  let bufferBeforeMinutes = 0;
  let bufferAfterMinutes = 0;
  if (body.schedulerServiceId?.trim()) {
    const svc = await fetchSchedulerServiceById(db, body.schedulerServiceId.trim());
    if (
      !svc ||
      !isCustomerVisibleService(svc) ||
      !schedulerServiceMatchesLine(svc, serviceLine)
    ) {
      return NextResponse.json({ error: "Invalid service selection" }, { status: 400 });
    }
    if (svc.durationMinutes !== durationMin) {
      return NextResponse.json(
        { error: "Duration does not match the selected service" },
        { status: 400 },
      );
    }
    schedulerServiceId = svc.id;
    serviceTypeName = svc.name;
    bufferBeforeMinutes = svc.bufferBeforeMinutes;
    bufferAfterMinutes = svc.bufferAfterMinutes;
  }
  // Same lengths as admin create for a catalog service (e.g. 45 minutes; it
  // matched the service above); without one, 30-minute steps as before. Starts
  // stay on the 30-minute grid either way.
  if (!isValidPublicBookingDurationMin(durationMin, schedulerServiceId ? durationMin : undefined)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  // Same buffer handling as admin inserts: block the service's buffers and
  // denormalize them on the booking so reschedules keep them.
  const buffers = { bufferBeforeMinutes, bufferAfterMinutes };
  const publicServiceFields = {
    ...(schedulerServiceId ? { schedulerServiceId, serviceTypeName: serviceTypeName ?? "" } : {}),
    ...(bufferBeforeMinutes > 0 ? { bufferBeforeMinutes } : {}),
    ...(bufferAfterMinutes > 0 ? { bufferAfterMinutes } : {}),
  };
  const eligible = await fetchActiveProvidersForPublicBooking(db, locationId, serviceLine, {
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
  let assignedProvider: ProviderRow | undefined;

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
      if (!providerAllowsAppointmentTime(provider, t, durationMin)) {
        return NextResponse.json(
          { error: "One of the repeated visits falls outside that provider's bookable hours" },
          { status: 400 },
        );
      }
    }
    assignedProviderId = provider.id;
    assignedDisplayName = provider.displayName;
    assignedProvider = provider;
  } else {
    const canAny = eligible.some((p) =>
      providerAllowsAppointmentTime(p, start, durationMin),
    );
    if (!canAny) {
      return NextResponse.json({ error: "Outside bookable hours for this service" }, { status: 400 });
    }
    assignedProviderId = "";
    assignedDisplayName = "";
  }

  const createdIds: string[] = [];
  // Start of each booked visit, parallel to createdIds (skipped dates are left out).
  const createdStarts: DateTime[] = [];
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
          buffers,
        );
        const holdIds = holdBucketIdsForPublicBooking(locationId, serviceLine, thisStart, durationMin);
        // The provider already booked at their other office at this time.
        const otherOfficeIds = otherOfficeBucketIdsForAppointment(
          locationId,
          assignedProvider!,
          thisStart,
          durationMin,
          buffers,
        );
        await db.runTransaction(async (tx) => {
          const request = requestRef
            ? await readBookingRequestInTx(tx, requestRef, requestAttempt)
            : null;
          const bucketRefs = bucketIds.map((id) => db.collection("slot_buckets").doc(id));
          const holdRefs = holdIds.map((id) => db.collection("slot_buckets").doc(id));
          const otherOfficeRefs = otherOfficeIds.map((id) => db.collection("slot_buckets").doc(id));
          const snaps = await Promise.all([...bucketRefs, ...otherOfficeRefs].map((r) => tx.get(r)));
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
            ...publicServiceFields,
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
          if (requestRef && request) {
            writeBookingRequestInTx(tx, requestRef, {
              exists: request.exists,
              attempt: requestAttempt,
              fingerprint: requestFingerprint,
              bookingId: bookingRef.id,
              providerId: assignedProviderId,
              providerDisplayName: assignedDisplayName,
              providerMode: "specific",
            });
          }
        });
      } else {
        const tryOrder = orderProvidersForAnyBooking(eligible, preferredProviderId);
        const holdIds = holdBucketIdsForPublicBooking(locationId, serviceLine, thisStart, durationMin);
        await db.runTransaction(async (tx) => {
          const request = requestRef
            ? await readBookingRequestInTx(tx, requestRef, requestAttempt)
            : null;
          const holdRefs = holdIds.map((id) => db.collection("slot_buckets").doc(id));
          const holdSnaps = await Promise.all(holdRefs.map((r) => tx.get(r)));
          if (holdSnaps.some((s) => s.exists)) throw new Error("slot_taken");

          type Candidate = {
            id: string;
            name: string;
            refs: DocumentReference[];
            /** Same time at the provider's other office: must be free, never written. */
            otherOfficeRefs: DocumentReference[];
          };
          const bucketRefsByProvider: Candidate[] = [];
          for (const p of tryOrder) {
            if (!providerAllowsAppointmentTime(p, thisStart, durationMin)) continue;
            const ids = bucketDocIdsForAppointment(locationId, p.id, thisStart, durationMin, buffers);
            const refs = ids.map((id) => db.collection("slot_buckets").doc(id));
            const otherOfficeRefs = otherOfficeBucketIdsForAppointment(
              locationId,
              p,
              thisStart,
              durationMin,
              buffers,
            ).map((id) => db.collection("slot_buckets").doc(id));
            bucketRefsByProvider.push({ id: p.id, name: p.displayName, refs, otherOfficeRefs });
          }
          let picked: Candidate | null = null;
          for (const row of bucketRefsByProvider) {
            const snaps = await Promise.all([...row.refs, ...row.otherOfficeRefs].map((r) => tx.get(r)));
            if (!snaps.some((s) => s.exists)) {
              picked = row;
              break;
            }
          }
          if (!picked) throw new Error("slot_taken");

          assignedProviderId = picked.id;
          assignedDisplayName = picked.name;

          const bucketIds = bucketDocIdsForAppointment(
            locationId,
            assignedProviderId,
            thisStart,
            durationMin,
            buffers,
          );
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
            ...publicServiceFields,
          });
          recordBookingEventInTx(db, tx, bookingRef.id, {
            type: "created",
            byUid: null,
            byEmail: body.email.trim().toLowerCase(),
            meta: { via: "public_form", providerMode: "any" },
          });
          if (requestRef && request) {
            writeBookingRequestInTx(tx, requestRef, {
              exists: request.exists,
              attempt: requestAttempt,
              fingerprint: requestFingerprint,
              bookingId: bookingRef.id,
              providerId: assignedProviderId,
              providerDisplayName: assignedDisplayName,
              providerMode: "any",
            });
          }
        });
      }
      createdIds.push(bookingRef.id);
      createdStarts.push(thisStart);
      await linkBookingAfterCreate(db, bookingRef.id, "online_booking").catch((err) =>
        console.error("[patients] link after public booking", err),
      );
    } catch (e) {
      // Another submit with this request id booked first (a double submit
      // racing this one): answer with what it booked.
      if (e instanceof Error && e.message === "duplicate_request" && requestRef) {
        const prior = await requestRef.get();
        const replay = replayFromBookingRequest(prior.exists ? prior.data() : undefined, requestFingerprint);
        if (replay.kind === "replay") return NextResponse.json(replay.body, { status: 201 });
        return NextResponse.json(
          { error: "That time was just taken. Pick another slot." },
          { status: 409 },
        );
      }
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

  // Describe the first visit actually booked (the first requested date may have been taken).
  const firstStart = createdStarts[0]!;
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

  const recurrenceNote = body.recurrence
    ? patientSeriesNote({
        frequency: body.recurrence.frequency,
        bookedIds: createdIds,
        skippedLabels: conflicts,
      })
    : undefined;

  const officeTo = process.env.OFFICE_NOTIFICATION_EMAIL;
  if (officeTo) {
    try {
      const officePayload = officeNotificationEmail(emailContext, undefined, {
        seriesLines: body.recurrence
          ? officeSeriesLines({
              frequency: body.recurrence.frequency,
              requestedCount: starts.length,
              bookedIds: createdIds,
              skippedLabels: conflicts,
            })
          : undefined,
      });
      let subject = officePayload.subject;
      const { text, html } = officePayload;
      if (createdIds.length > 1) {
        subject = `[${createdIds.length} visits] ${subject}`;
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
    console.log("[booking] Sending patient confirmation for", emailContext.bookingId);
    await sendBookingNotification({
      to: emailContext.email,
      subject,
      text,
      html,
    });
    console.log("[booking] Patient email send completed for", emailContext.bookingId);
  } catch (err) {
    console.error("Patient SendGrid failed", err);
  }

  let paymentUrl: string | undefined;
  if (
    publicBooking.onlinePaymentsEnabled &&
    createdIds.length === 1 &&
    !body.recurrence
  ) {
    const cents = resolvePublicBookingPrepayCents(serviceLine, durationMin);
    if (cents !== null) {
      const primaryId = createdIds[0]!;
      const linkResult = await createPaymentLink({
        amountCents: cents,
        patientName: body.name.trim(),
        bookingId: primaryId,
        description: `${serviceLineEmailLabel(serviceLine)} · ${durationMin} min (online booking)`,
      });
      if (linkResult.created) {
        const ref = db.collection("bookings").doc(primaryId);
        await ref.update({
          paymentLinkUrl: linkResult.url,
          paymentLinkId: linkResult.paymentLinkId,
          paymentAmountCents: cents,
          paymentDescription: `${serviceLineEmailLabel(serviceLine)} · ${durationMin} min (online booking)`,
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
  const locOffice = (await emailLocations())[locationId];
  const firstName = body.name.trim().split(/\s+/)[0] || body.name.trim();
  const when = firstStart.setZone(TIME_ZONE).toFormat("LLLL d yyyy 'at' h:mm a");
  // Massage is booked with The Rub Club; chiropractic and stretch are Chiropractic Associates.
  const biz = serviceLine === "massage" ? "The Rub Club" : "Chiropractic Associates";
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

  const responseBody = {
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
  };
  // A retry with this request id now gets exactly this response.
  if (requestRef) {
    await requestRef
      .set({ response: responseBody, completedAt: FieldValue.serverTimestamp() }, { merge: true })
      .catch((err) => console.error("[booking] could not save request response", err));
  }

  return NextResponse.json(responseBody, { status: 201 });
}
