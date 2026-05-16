import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { parsePatientDoc, PATIENTS_COLLECTION } from "@/lib/patients-db";
import { buildPatientsExportCsv } from "@/lib/patients-export-csv";
import { TIME_ZONE } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getFirestore();
  const snap = await db.collection(PATIENTS_COLLECTION).orderBy("lastName", "asc").limit(5000).get();

  const patients = [];
  for (const doc of snap.docs) {
    const parsed = parsePatientDoc(doc.id, doc.data());
    if (parsed && !parsed.deleted) patients.push(parsed);
  }

  const csv = buildPatientsExportCsv(patients);
  const date = DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="patients_${date}.csv"`,
    },
  });
}
