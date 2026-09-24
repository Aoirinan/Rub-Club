import { NextResponse } from "next/server";
import { verifyBearerUid, getStaffProfile } from "@/lib/staff-auth";
import { staffCapabilities, effectiveLocationScope } from "@/lib/staff-roles";
import { signInPredatesClaim } from "@/lib/staff-account-claim";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const decoded = await verifyBearerUid(req.headers.get("authorization"));
  if (!decoded?.uid) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  const loaded = await getStaffProfile(decoded.uid);
  // Same rule as requireStaff: a session from before the account was secured
  // for its invite is not this staff member's, so it gets no role.
  const profile =
    loaded && !signInPredatesClaim(decoded.auth_time, loaded.signInValidAfterMs) ? loaded : null;
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
    locationScope: effectiveLocationScope(profile.role, profile.locationScope),
  });
}
