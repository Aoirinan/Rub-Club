import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import type { PatientBusinessTag } from "@/lib/patient-business";
import {
  createPatient,
  listPatients,
  parsePatientDoc,
  patientToApiRow,
  PATIENTS_COLLECTION,
  type PatientPaymentType,
} from "@/lib/patients-db";

export const runtime = "nodejs";

const createSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).optional(),
  phone: z.string().min(7).max(40),
  email: z.string().max(200).optional(),
  dateOfBirth: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(40).optional(),
  zip: z.string().max(20).optional(),
  paymentType: z.enum(["cash", "insurance", "mixed"]).optional(),
  insuranceCarrier: z.string().max(120).optional(),
  insuranceMemberId: z.string().max(80).optional(),
  notes: z.string().max(4000).optional(),
  businessTag: z.enum(["rub_club", "chiro", "both"]).optional(),
});

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const idsRaw = searchParams.get("ids");
  if (idsRaw?.trim()) {
    const db = getFirestore();
    const ids = idsRaw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 80);
    const patients = [];
    for (const id of ids) {
      const snap = await db.collection(PATIENTS_COLLECTION).doc(id).get();
      if (!snap.exists) continue;
      const p = parsePatientDoc(snap.id, snap.data() ?? {});
      if (p && !p.deleted) patients.push(patientToApiRow(p));
    }
    return NextResponse.json({ patients, total: patients.length, page: 1, limit: patients.length });
  }

  const search = searchParams.get("search") ?? undefined;
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 50;
  const paymentRaw = searchParams.get("paymentType");
  const paymentType =
    paymentRaw === "cash" || paymentRaw === "insurance" || paymentRaw === "mixed"
      ? (paymentRaw as PatientPaymentType)
      : "all";
  const activeOnly = searchParams.get("active") === "true";
  const businessRaw = searchParams.get("business");
  const businessTag =
    businessRaw === "rub_club" || businessRaw === "chiro" || businessRaw === "both"
      ? (businessRaw as PatientBusinessTag)
      : "all";

  const result = await listPatients({
    search,
    page,
    limit,
    paymentType,
    businessTag,
    activeOnly,
  });

  return NextResponse.json(result);
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

  const db = getFirestore();
  const result = await createPatient(db, {
    ...parsed.data,
    source: "manual",
  });

  if (!result.created && result.existingId) {
    return NextResponse.json({
      patient: result.patient,
      existingId: result.existingId,
      message: "Patient with this phone already exists.",
    });
  }

  return NextResponse.json({ patient: result.patient }, { status: 201 });
}
