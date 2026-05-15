import { NextResponse } from "next/server";
import { isSuperadminRequest } from "@/lib/superadmin-auth";
import { fetchPatientRecordByPhoneDigits } from "@/lib/patient-record-lookup";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isSuperadminRequest(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = new URL(req.url).searchParams.get("phone") ?? "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7) {
    return NextResponse.json({ error: "phone query required (7+ digits)" }, { status: 400 });
  }

  const { bookings, intakes, smsLog } = await fetchPatientRecordByPhoneDigits(digits);
  return NextResponse.json({ bookings, intakes, smsLog });
}
