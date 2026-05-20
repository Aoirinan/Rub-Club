import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { fetchPatientRecordByNameQuery, fetchPatientRecordByPhoneDigits } from "@/lib/patient-record-lookup";
import { parsePatientLookupSearchParams } from "@/lib/patient-search-parse";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = parsePatientLookupSearchParams(url.searchParams.get("q"), url.searchParams.get("phone"));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.mode === "phone") {
    const { bookings, smsLog } = await fetchPatientRecordByPhoneDigits(parsed.digits);
    return NextResponse.json({ bookings, smsLog, mode: "phone" as const });
  }

  const { bookings, smsLog } = await fetchPatientRecordByNameQuery(parsed.name);
  return NextResponse.json({ bookings, smsLog, mode: "name" as const });
}
