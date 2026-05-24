import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { PROVIDER_BG_COLOR_IDS, PROVIDER_TEXT_COLOR_IDS } from "@/lib/provider-colors";
import { parseSchedulerServiceDoc } from "@/lib/scheduler-services-db";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  priceCents: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  bufferBeforeMinutes: z.number().int().min(0).max(120).optional(),
  bufferAfterMinutes: z.number().int().min(0).max(120).optional(),
  textColor: z.enum(PROVIDER_TEXT_COLOR_IDS).nullable().optional(),
  bgColor: z.enum(PROVIDER_BG_COLOR_IDS).nullable().optional(),
  visibility: z.enum(["both", "admin_only", "customer_only"]).optional(),
  active: z.boolean().optional(),
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
  const db = getFirestore();
  const ref = db.collection("scheduler_services").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updates: Record<string, unknown> = {
    ...parsed.data,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: staff.uid,
  };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
  await ref.update(updates);
  const next = await ref.get();
  const row = parseSchedulerServiceDoc(next.id, next.data()!);
  return NextResponse.json({ service: row });
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
  const ref = db.collection("scheduler_services").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await ref.update({
    active: false,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: staff.uid,
  });
  return NextResponse.json({ ok: true });
}
