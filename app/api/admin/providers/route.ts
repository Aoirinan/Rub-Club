import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import type { LocationId, ServiceLine } from "@/lib/constants";
import { fetchAllProviders, parseProviderDoc } from "@/lib/providers-db";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const createSchema = z.object({
  displayName: z.string().min(1).max(120),
  locationIds: z.array(z.enum(["paris", "sulphur_springs"])).min(1),
  serviceLines: z.array(z.enum(["massage", "chiropractic"])).min(1),
  active: z.boolean().optional(),
  sortOrder: z.number().optional(),
  schedule: z
    .object({
      openHour: z.number(),
      openMinute: z.number(),
      closeHour: z.number(),
      closeMinute: z.number(),
    })
    .nullable()
    .optional(),
});

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getFirestore();
  const providers = await fetchAllProviders(db);
  return NextResponse.json({ providers });
}

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
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
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const body = parsed.data;
  const db = getFirestore();
  const ref = db.collection("providers").doc();

  const doc: Record<string, unknown> = {
    displayName: body.displayName.trim(),
    active: body.active ?? true,
    locationIds: body.locationIds as LocationId[],
    serviceLines: body.serviceLines as ServiceLine[],
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: staff.uid,
  };
  if (body.schedule !== undefined) {
    doc.schedule = body.schedule;
  }

  await ref.set(doc);

  const snap = await ref.get();
  const d = snap.data();
  if (!d) {
    return NextResponse.json({ error: "Could not read provider" }, { status: 500 });
  }
  const row = parseProviderDoc(snap.id, d);
  if (!row) {
    return NextResponse.json({ error: "Invalid provider data" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, provider: row }, { status: 201 });
}
