import { NextResponse } from "next/server";
import { verifyBearerUid, getStaffRole } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const decoded = await verifyBearerUid(req.headers.get("authorization"));
  if (!decoded?.uid) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  const role = await getStaffRole(decoded.uid);
  return NextResponse.json({
    authenticated: true,
    uid: decoded.uid,
    email: decoded.email ?? null,
    role,
  });
}
