import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { TIME_ZONE, type LocationId } from "@/lib/constants";
import { requireStaff } from "@/lib/staff-auth";
import {
  holdBucketIdsForHold,
  isAlignedToSlotGrid,
  parseStartIsoToDateTime,
  type HoldScope,
} from "@/lib/slots-luxon";

export const runtime = "nodejs";

const createSchema = z.object({
  locationId: z.enum(["paris", "sulphur_springs"]),
  scope: z.enum(["all", "massage", "chiropractic"]),
  startIso: z.string().min(8),
  durationMin: z.number().int().positive().max(720),
  note: z.string().max(400).optional(),
});

type HoldRow = {
  id: string;
  locationId: LocationId;
  scope: HoldScope;
  startIso: string;
  startAtMs: number;
  durationMin: number;
  endIso: string;
  endAtMs: number;
  note: string;
  bucketIds: string[];
  createdByUid: string | null;
  createdByEmail: string | null;
  createdAtMs: number | null;
};

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const locationId = searchParams.get("locationId") as LocationId | null;

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (locationId && locationId !== "paris" && locationId !== "sulphur_springs") {
    return NextResponse.json({ error: "Invalid locationId" }, { status: 400 });
  }

  const db = getFirestore();
  let q: FirebaseFirestore.Query = db.collection("slot_holds");
  if (locationId) q = q.where("locationId", "==", locationId);

  if (date) {
    const dayStart = DateTime.fromISO(date, { zone: TIME_ZONE }).startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    q = q
      .where("startAt", ">=", Timestamp.fromDate(dayStart.toUTC().toJSDate()))
      .where("startAt", "<", Timestamp.fromDate(dayEnd.toUTC().toJSDate()));
  } else {
    const now = DateTime.now().setZone(TIME_ZONE).startOf("day");
    q = q.where("startAt", ">=", Timestamp.fromDate(now.toUTC().toJSDate()));
  }

  const snap = await q.get();
  const rows: HoldRow[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    const startAt = data.startAt as Timestamp | undefined;
    const endAt = data.endAt as Timestamp | undefined;
    const createdAt = data.createdAt as Timestamp | undefined;
    rows.push({
      id: d.id,
      locationId: data.locationId,
      scope: data.scope,
      startIso: data.startIso,
      startAtMs: startAt ? startAt.toMillis() : 0,
      durationMin: data.durationMin,
      endIso: data.endIso ?? "",
      endAtMs: endAt ? endAt.toMillis() : 0,
      note: data.note ?? "",
      bucketIds: Array.isArray(data.bucketIds) ? data.bucketIds : [],
      createdByUid: data.createdByUid ?? null,
      createdByEmail: data.createdByEmail ?? null,
      createdAtMs: createdAt ? createdAt.toMillis() : null,
    });
  }
  rows.sort((a, b) => a.startAtMs - b.startAtMs);
  return NextResponse.json({ holds: rows });
}

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

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const start = parseStartIsoToDateTime(body.startIso);
  if (!start || !isAlignedToSlotGrid(start)) {
    return NextResponse.json(
      { error: "Invalid start time — must be on a 30-minute grid" },
      { status: 400 },
    );
  }
  if (body.durationMin % 30 !== 0) {
    return NextResponse.json(
      { error: "Duration must be a multiple of 30 minutes" },
      { status: 400 },
    );
  }

  const locationId = body.locationId as LocationId;
  const scope = body.scope as HoldScope;
  const end = start.plus({ minutes: body.durationMin });

  const db = getFirestore();
  const holdRef = db.collection("slot_holds").doc();
  const bucketIds = holdBucketIdsForHold(locationId, scope, start, body.durationMin);

  try {
    await db.runTransaction(async (tx) => {
      const bucketRefs = bucketIds.map((id) => db.collection("slot_buckets").doc(id));
      const snaps = await Promise.all(bucketRefs.map((r) => tx.get(r)));
      for (const s of snaps) {
        if (s.exists) throw new Error("bucket_conflict");
      }
      for (const ref of bucketRefs) {
        tx.set(ref, {
          holdId: holdRef.id,
          locationId,
          scope,
          startIso: start.toUTC().toISO(),
          durationMin: body.durationMin,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      tx.set(holdRef, {
        locationId,
        scope,
        startIso: start.toUTC().toISO(),
        startAt: Timestamp.fromDate(start.toUTC().toJSDate()),
        endIso: end.toUTC().toISO(),
        endAt: Timestamp.fromDate(end.toUTC().toJSDate()),
        durationMin: body.durationMin,
        note: body.note?.trim() ?? "",
        bucketIds,
        createdByUid: staff.uid,
        createdByEmail: staff.email ?? null,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "bucket_conflict") {
      return NextResponse.json(
        {
          error:
            "One or more slots in this range are already taken by a booking or another hold. Resolve those first, then try again.",
        },
        { status: 409 },
      );
    }
    console.error("[admin/holds POST]", e);
    return NextResponse.json({ error: "Could not create hold" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, holdId: holdRef.id, bucketIds }, { status: 201 });
}
