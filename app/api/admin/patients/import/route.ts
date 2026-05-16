import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { importPatientsFromCsv } from "@/lib/patients-csv-import";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  const updateExisting = form.get("updateExisting") === "true" || form.get("updateExisting") === "on";
  const text = await file.text();
  const db = getFirestore();
  const result = await importPatientsFromCsv(db, text, updateExisting);

  return NextResponse.json(result);
}
