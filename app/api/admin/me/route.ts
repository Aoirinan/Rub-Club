import { NextResponse } from "next/server";
import { verifyBearerUid, getStaffProfile } from "@/lib/staff-auth";
import { staffCapabilities } from "@/lib/staff-roles";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const decoded = await verifyBearerUid(req.headers.get("authorization"));
  if (!decoded?.uid) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  const profile = await getStaffProfile(decoded.uid);
  if (!profile) {
    return NextResponse.json({
      authenticated: true,
      uid: decoded.uid,
      email: decoded.email ?? null,
      role: null,
    });
  }
  return NextResponse.json({
    authenticated: true,
    uid: decoded.uid,
    email: decoded.email ?? null,
    role: profile.role,
    linkedProviderId: profile.linkedProviderId ?? null,
    capabilities: staffCapabilities(profile.role),
  });
}
