import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";

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

  const key = process.env.SENDGRID_API_KEY?.trim();
  const from = process.env.SENDGRID_FROM_EMAIL?.trim();
  return NextResponse.json({
    sendgridConfigured: Boolean(key && from),
    hasApiKey: Boolean(key),
    hasFromEmail: Boolean(from),
  });
}
