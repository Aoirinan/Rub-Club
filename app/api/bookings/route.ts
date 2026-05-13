import { NextResponse } from "next/server";
import { FieldValue, Timestamp, type DocumentReference } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import type { DurationMin, LocationId, ServiceLine } from "@/lib/constants";
import { TIME_ZONE } from "@/lib/constants";
import { assertRateLimitOk, getClientIp } from "@/lib/rate-limit";
import {
  fetchActiveProvidersForService,
  orderProvidersForAnyBooking,
} from "@/lib/providers-db";
import { sendBookingNotification } from "@/lib/sendgrid";
import {
  bucketDocIdsForAppointment,
  isAlignedToSlotGrid,
  isWithinScheduleWindow,
  parseStartIsoToDateTime,
} from "@/lib/slots-luxon";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    locationId: z.enum(["paris", "sulphur_springs"]),
    serviceLine: z.enum(["massage", "chiropractic"]),
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
  })
  .superRefine((val, ctx) => {
    if (val.providerMode === "specific" && !val.providerId?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "providerId is required when providerMode is specific",
        path: ["providerId"],
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

  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const start = parseStartIsoToDateTime(body.startIso);
  if (!start || !isAlignedToSlotGrid(start)) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
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

  const db = getFirestore();
  const eligible = await fetchActiveProvidersForService(db, locationId, serviceLine);
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
    if (!isWithinScheduleWindow(start, durationMin, provider.schedule ?? null)) {
      return NextResponse.json({ error: "Outside that provider's bookable hours" }, { status: 400 });
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

  const bookingRef = db.collection("bookings").doc();

  try {
    if (body.providerMode === "specific") {
      const bucketIds = bucketDocIdsForAppointment(locationId, assignedProviderId, start, durationMin);
      await db.runTransaction(async (tx) => {
        const bucketRefs = bucketIds.map((id) => db.collection("slot_buckets").doc(id));
        const snaps = await Promise.all(bucketRefs.map((r) => tx.get(r)));
        for (const s of snaps) {
          if (s.exists) throw new Error("slot_taken");
        }
        const startAt = Timestamp.fromDate(start.toUTC().toJSDate());
        for (const ref of bucketRefs) {
          tx.set(ref, {
            bookingId: bookingRef.id,
            locationId,
            providerId: assignedProviderId,
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
          status: "confirmed",
          sourceIp: getClientIp(req.headers),
          createdAt: FieldValue.serverTimestamp(),
        });
      });
    } else {
      const tryOrder = orderProvidersForAnyBooking(eligible, preferredProviderId);
      await db.runTransaction(async (tx) => {
        const bucketRefsByProvider: { id: string; name: string; refs: DocumentReference[] }[] = [];
        for (const p of tryOrder) {
          if (!isWithinScheduleWindow(start, durationMin, p.schedule ?? null)) continue;
          const ids = bucketDocIdsForAppointment(locationId, p.id, start, durationMin);
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

        const bucketIds = bucketDocIdsForAppointment(locationId, assignedProviderId, start, durationMin);
        const startAt = Timestamp.fromDate(start.toUTC().toJSDate());

        for (const ref of picked.refs) {
          tx.set(ref, {
            bookingId: bookingRef.id,
            locationId,
            providerId: assignedProviderId,
            serviceLine,
            durationMin,
            startIso: start.toUTC().toISO(),
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
          startIso: start.toUTC().toISO(),
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
          status: "confirmed",
          sourceIp: getClientIp(req.headers),
          createdAt: FieldValue.serverTimestamp(),
        });
      });
    }
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
    let prefNote = "";
    if (preferredProviderId) {
      const prefName =
        eligible.find((p) => p.id === preferredProviderId)?.displayName ?? preferredProviderId;
      if (preferredProviderId !== assignedProviderId) {
        prefNote = `Client preference (not guaranteed): ${prefName}. Assigned: ${assignedDisplayName}.`;
      } else if (body.providerMode === "any") {
        prefNote = `Client preferred first-available slot with: ${prefName} (matched).`;
      } else {
        prefNote = `Client preference: ${prefName}.`;
      }
    }

    const text = [
      "New online booking request",
      `Booking ID: ${bookingRef.id}`,
      `When (Chicago): ${start.setZone(TIME_ZONE).toFormat("cccc, LLL d yyyy — h:mm a")} (${TIME_ZONE})`,
      `Duration: ${body.durationMin} minutes`,
      `Service: ${body.serviceLine}`,
      `Location: ${body.locationId}`,
      `Provider: ${assignedDisplayName} (${assignedProviderId})`,
      `Booking type: ${body.providerMode === "any" ? "first available" : "specific provider"}`,
      prefNote,
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

  return NextResponse.json(
    {
      ok: true,
      bookingId: bookingRef.id,
      providerId: assignedProviderId,
      providerDisplayName: assignedDisplayName,
      providerMode: body.providerMode,
    },
    { status: 201 },
  );
}
