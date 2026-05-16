import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { uploadPatientInsuranceCard } from "@/lib/patient-insurance-upload";
import { PATIENTS_COLLECTION } from "@/lib/patients-db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function isFile(v: FormDataEntryValue | null): v is File {
  return v !== null && typeof v === "object" && "arrayBuffer" in (v as Blob);
}

export async function POST(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getFirestore();
  const ref = db.collection(PATIENTS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.get("deleted") === true) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const sideRaw = form.get("side");
  const side = sideRaw === "back" ? "back" : "front";
  const file = form.get("file");
  if (!isFile(file)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const contentType = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadPatientInsuranceCard({
      patientId: id,
      side,
      buffer,
      contentType,
    });

    const field = side === "front" ? "insuranceCardFront" : "insuranceCardBack";
    await ref.update({
      [field]: url,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, url, field });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
