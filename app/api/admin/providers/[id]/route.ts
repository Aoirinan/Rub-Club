import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import type { LocationId, ServiceLine } from "@/lib/constants";
import { parseProviderDoc } from "@/lib/providers-db";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const patchSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  locationIds: z.array(z.enum(["paris", "sulphur_springs"])).min(1).optional(),
  serviceLines: z.array(z.enum(["massage", "chiropractic"])).min(1).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().optional(),
  acceptsNewClients: z.boolean().optional(),
  photoUrl: z.string().max(800).nullable().optional(),
  about: z.string().max(4000).nullable().optional(),
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

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const body = parsed.data;
  const db = getFirestore();
  const ref = db.collection("providers").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: staff.uid,
  };
  if (body.displayName !== undefined) updates.displayName = body.displayName.trim();
  if (body.locationIds !== undefined) updates.locationIds = body.locationIds as LocationId[];
  if (body.serviceLines !== undefined) updates.serviceLines = body.serviceLines as ServiceLine[];
  if (body.active !== undefined) updates.active = body.active;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
  if (body.schedule !== undefined) updates.schedule = body.schedule;
  if (body.acceptsNewClients !== undefined) updates.acceptsNewClients = body.acceptsNewClients;
  if (body.photoUrl !== undefined) {
    updates.photoUrl = body.photoUrl === null ? null : body.photoUrl.trim() || null;
  }
  if (body.about !== undefined) {
    updates.about = body.about === null ? null : body.about.trim() || null;
  }

  await ref.update(updates);
  const next = await ref.get();
  const data = next.data();
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const row = parseProviderDoc(next.id, data);
  if (!row) {
    return NextResponse.json({ error: "Invalid provider data" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, provider: row });
}

export async function DELETE(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getFirestore();
  const ref = db.collection("providers").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const permanent =
    new URL(req.url).searchParams.get("permanent") === "1" ||
    new URL(req.url).searchParams.get("permanent") === "true";

  if (permanent) {
    await ref.delete();
    return NextResponse.json({ ok: true });
  }

  await ref.update({
    active: false,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: staff.uid,
  });
  return NextResponse.json({ ok: true });
}
