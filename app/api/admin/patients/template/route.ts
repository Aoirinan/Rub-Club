import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { PATIENT_CSV_TEMPLATE } from "@/lib/patients-export-csv";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return new NextResponse(PATIENT_CSV_TEMPLATE, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="patients_import_template.csv"',
    },
  });
}
