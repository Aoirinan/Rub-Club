import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import {
  deletePatientPermanently,
  getPatientBookings,
  normalizePatientPhone,
  parsePatientDoc,
  patientToApiRow,
  PATIENTS_COLLECTION,
} from "@/lib/patients-db";

export const runtime = "nodejs";

const patchSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().max(80).optional(),
  phone: z.string().min(7).max(40).optional(),
  email: z.string().max(200).optional(),
  dateOfBirth: z.string().max(20).optional(),
  address: z.string().max(200).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  state: z.string().max(40).nullable().optional(),
  zip: z.string().max(20).nullable().optional(),
  paymentType: z.enum(["cash", "insurance", "mixed"]).optional(),
  insuranceCarrier: z.string().max(120).nullable().optional(),
  insuranceMemberId: z.string().max(80).nullable().optional(),
  insuranceCardFront: z.string().max(800).nullable().optional(),
  insuranceCardBack: z.string().max(800).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getFirestore();
  const snap = await db.collection(PATIENTS_COLLECTION).doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patient = parsePatientDoc(snap.id, snap.data() ?? {});
  if (!patient || patient.deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bookings = await getPatientBookings(id);
  return NextResponse.json({ patient: patientToApiRow(patient), bookings });
}

export async function PATCH(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
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
  const ref = db.collection(PATIENTS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  const body = parsed.data;

  if (body.phone !== undefined) {
    const norm = normalizePatientPhone(body.phone);
    if (!norm) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    updates.phone = norm.phone;
    updates.phoneNormalized = norm.phoneNormalized;
  }

  const stringFields = [
    "firstName",
    "lastName",
    "email",
    "dateOfBirth",
    "address",
    "city",
    "state",
    "zip",
    "paymentType",
    "insuranceCarrier",
    "insuranceMemberId",
    "insuranceCardFront",
    "insuranceCardBack",
    "notes",
  ] as const;

  for (const key of stringFields) {
    const v = body[key];
    if (v === undefined) continue;
    if (v === null) {
      updates[key] = FieldValue.delete();
    } else if (typeof v === "string") {
      updates[key] = key === "email" ? v.trim().toLowerCase() : v.trim();
    }
  }

  await ref.update(updates);
  const next = await ref.get();
  const patient = parsePatientDoc(id, next.data() ?? {});
  if (!patient) {
    return NextResponse.json({ error: "Invalid patient record" }, { status: 500 });
  }

  return NextResponse.json({ patient: patientToApiRow(patient) });
}

export async function DELETE(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getFirestore();
  const ref = db.collection(PATIENTS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deletePatientPermanently(db, id);

  return NextResponse.json({ ok: true });
}
