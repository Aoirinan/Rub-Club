import { NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import type { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import type { LocationId, ServiceLine } from "@/lib/constants";
import { isValidBookingDurationMin } from "@/lib/booking-duration";
import { formatChicagoSlotChoice } from "@/lib/chicago-datetime-format";
import { fetchActiveProvidersForPublicBooking } from "@/lib/providers-db";
import { providerAllowsAppointmentTime } from "@/lib/provider-scheduling";
import { providerHoursContext } from "@/lib/provider-profile";
import {
  bucketDocIdsForAppointment,
  holdBucketIdsForPublicBooking,
  unionCandidateStartsFromHoursContexts,
  enumerateCandidateStartsInWindow,
  effectiveDayWindowFromHours,
} from "@/lib/slots-luxon";
import { getPublicBookingConfig, isPublicBookingEnabled } from "@/lib/public-booking-settings";

export const runtime = "nodejs";

type ProviderMode = "specific" | "any";

async function bucketsFree(
  db: Firestore,
  locationId: LocationId,
  providerId: string,
  serviceLine: ServiceLine,
  start: DateTime,
  durationMin: number,
): Promise<boolean> {
  const providerIds = bucketDocIdsForAppointment(locationId, providerId, start, durationMin);
  const holdIds = holdBucketIdsForPublicBooking(locationId, serviceLine, start, durationMin);
  const allIds = [...providerIds, ...holdIds];
  const refs = allIds.map((id) => db.collection("slot_buckets").doc(id));
  const snaps = await db.getAll(...refs);
  return !snaps.some((s) => s.exists);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const previewOnly = searchParams.get("preview") === "1";
    const publicBooking = await getPublicBookingConfig();
    if (!isPublicBookingEnabled(publicBooking) && !previewOnly) {
      return NextResponse.json(
        { error: publicBooking.disabledMessage, slots: [] },
        { status: 503 },
      );
    }
    const locationId = searchParams.get("locationId") as LocationId | null;
    const date = searchParams.get("date");
    const durationRaw = searchParams.get("durationMin");
    const serviceLine = searchParams.get("serviceLine") as ServiceLine | null;
    const providerMode = (searchParams.get("providerMode") ?? "specific") as ProviderMode;
    const providerIdRaw = searchParams.get("providerId");

    if (locationId !== "paris" && locationId !== "sulphur_springs") {
      return NextResponse.json({ error: "Invalid locationId" }, { status: 400 });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const durationMin = Number(durationRaw);
    if (!isValidBookingDurationMin(durationMin)) {
      return NextResponse.json({ error: "Invalid durationMin" }, { status: 400 });
    }
    if (serviceLine !== "massage" && serviceLine !== "chiropractic" && serviceLine !== "stretch") {
      return NextResponse.json({ error: "Invalid serviceLine" }, { status: 400 });
    }
    if (providerMode !== "specific" && providerMode !== "any") {
      return NextResponse.json({ error: "Invalid providerMode" }, { status: 400 });
    }
    if (providerMode === "specific" && !providerIdRaw?.trim()) {
      return NextResponse.json({ error: "providerId required when providerMode is specific" }, { status: 400 });
    }

    const db = getFirestore();
    const eligible = await fetchActiveProvidersForPublicBooking(db, locationId, serviceLine, {
      publicBooking: true,
    });

    if (eligible.length === 0) {
      return NextResponse.json({
        slots: [],
        providerMode,
        message:
          "No providers are set up for this location and service yet. A manager can add bookable providers under Scheduler → Manager.",
      });
    }

    const available: { startIso: string; label: string }[] = [];

    if (providerMode === "specific") {
      const providerId = providerIdRaw!.trim();
      const provider = eligible.find((p) => p.id === providerId);
      if (!provider) {
        return NextResponse.json({ error: "Unknown or inactive provider for this location/service" }, { status: 400 });
      }
      const hoursCtx = providerHoursContext(provider);
      const window = effectiveDayWindowFromHours(date, hoursCtx);
      const candidates = enumerateCandidateStartsInWindow(date, durationMin, window);
      for (const start of candidates) {
        if (!providerAllowsAppointmentTime(provider, start, durationMin)) continue;
        if (await bucketsFree(db, locationId, providerId, serviceLine, start, durationMin)) {
          available.push({
            startIso: start.toUTC().toISO()!,
            label: formatChicagoSlotChoice(start),
          });
        }
      }
    } else {
      const contexts = eligible.map((p) => providerHoursContext(p));
      const candidates = unionCandidateStartsFromHoursContexts(date, durationMin, contexts);
      for (const start of candidates) {
        const usable = eligible.filter((p) => providerAllowsAppointmentTime(p, start, durationMin));
        let open = false;
        for (const p of usable) {
          if (await bucketsFree(db, locationId, p.id, serviceLine, start, durationMin)) {
            open = true;
            break;
          }
        }
        if (open) {
          available.push({
            startIso: start.toUTC().toISO()!,
            label: formatChicagoSlotChoice(start),
          });
        }
      }
    }

    return NextResponse.json({ slots: available, providerMode });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Missing Firebase Admin credentials")) {
      return NextResponse.json(
        {
          error:
            "Server is missing FIREBASE_SERVICE_ACCOUNT_KEY. Add it under Vercel → Settings → Environment Variables (Production), then redeploy.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Failed to load slots" }, { status: 500 });
  }
}
