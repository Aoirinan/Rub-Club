import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import type { DurationMin, LocationId } from "@/lib/constants";
import {
  enumerateCandidateStarts,
  bucketDocIdsForAppointment,
} from "@/lib/slots-luxon";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId") as LocationId | null;
    const date = searchParams.get("date");
    const durationRaw = searchParams.get("durationMin");

    if (locationId !== "paris" && locationId !== "sulphur_springs") {
      return NextResponse.json({ error: "Invalid locationId" }, { status: 400 });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const durationMin = Number(durationRaw) as DurationMin;
    if (durationMin !== 30 && durationMin !== 60) {
      return NextResponse.json({ error: "Invalid durationMin" }, { status: 400 });
    }

    const candidates = enumerateCandidateStarts(date, durationMin);
    const db = getFirestore();

    const available: { startIso: string; label: string }[] = [];

    for (const start of candidates) {
      const ids = bucketDocIdsForAppointment(locationId, start, durationMin);
      const refs = ids.map((id) => db.collection("slot_buckets").doc(id));
      const snaps = await db.getAll(...refs);
      const taken = snaps.some((s) => s.exists);
      if (!taken) {
        available.push({
          startIso: start.toUTC().toISO()!,
          label: start.toFormat("cccc, LLL d — h:mm a"),
        });
      }
    }

    return NextResponse.json({ slots: available });
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
