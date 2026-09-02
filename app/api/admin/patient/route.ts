import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { fetchPatientRecordByNameQuery, fetchPatientRecordByPhoneDigits } from "@/lib/patient-record-lookup";
import { parsePatientLookupSearchParams } from "@/lib/patient-search-parse";

export const runtime = "nodejs";

/**
 * Lookup is a POST with the search term in the JSON body so patient names and
 * phone numbers never land in request/hosting logs as query strings.
 */
export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = (json && typeof json === "object" ? json : {}) as { q?: unknown; phone?: unknown };
  const q = typeof body.q === "string" ? body.q : null;
  const phone = typeof body.phone === "string" ? body.phone : null;

  const parsed = parsePatientLookupSearchParams(q, phone);
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
