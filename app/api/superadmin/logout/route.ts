import { NextResponse } from "next/server";
import { SUPERADMIN_COOKIE, superadminCookieOptions } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SUPERADMIN_COOKIE, "", { ...superadminCookieOptions(), maxAge: 0 });
  return res;
}
