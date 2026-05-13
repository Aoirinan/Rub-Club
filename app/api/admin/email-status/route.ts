import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";

import { getSendgridApiKey, getSendgridFromEmail } from "@/lib/sendgrid";

export const runtime = "nodejs";

/**
 * Whether outbound staff/notification email can be attempted (env present).
 * Does not expose keys or addresses.
 */
export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = getSendgridApiKey();
  const from = getSendgridFromEmail();
  return NextResponse.json({
    sendgridConfigured: Boolean(key && from),
    hasApiKey: Boolean(key),
    hasFromEmail: Boolean(from),
  });
}
