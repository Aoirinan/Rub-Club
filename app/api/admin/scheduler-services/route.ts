import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { PROVIDER_BG_COLOR_IDS, PROVIDER_TEXT_COLOR_IDS } from "@/lib/provider-colors";
import {
  ensureSchedulerServicesSeeded,
  fetchAllSchedulerServices,
  reorderSchedulerServices,
} from "@/lib/scheduler-services-db";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  priceCents: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(15).max(480),
  bufferBeforeMinutes: z.number().int().min(0).max(120).optional(),
  bufferAfterMinutes: z.number().int().min(0).max(120).optional(),
  textColor: z.enum(PROVIDER_TEXT_COLOR_IDS).nullable().optional(),
  bgColor: z.enum(PROVIDER_BG_COLOR_IDS).nullable().optional(),
  visibility: z.enum(["both", "admin_only", "customer_only"]).optional(),
  active: z.boolean().optional(),
});

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getFirestore();
  await ensureSchedulerServicesSeeded(db);
  const services = await fetchAllSchedulerServices(db);
  return NextResponse.json({ services });
}

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
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
  const existing = await fetchAllSchedulerServices(db);
  const sortOrder =
    existing.length === 0 ? 0 : Math.max(...existing.map((s) => s.sortOrder), 0) + 1;
  const ref = db.collection("scheduler_services").doc();
  await ref.set({
    name: body.name.trim(),
    priceCents: body.priceCents ?? 0,
    durationMinutes: body.durationMinutes,
    bufferBeforeMinutes: body.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: body.bufferAfterMinutes ?? 0,
    textColor: body.textColor ?? "black",
    bgColor: body.bgColor ?? "light_gray",
    visibility: body.visibility ?? "both",
    active: body.active ?? true,
    sortOrder,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: staff.uid,
  });
  const snap = await ref.get();
  return NextResponse.json({ id: ref.id, ...snap.data() }, { status: 201 });
}

export async function PATCH(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = reorderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const db = getFirestore();
  await reorderSchedulerServices(db, parsed.data.orderedIds);
  const services = await fetchAllSchedulerServices(db);
  return NextResponse.json({ services });
}
