import { NextResponse } from "next/server";
import {
  isSuperadminConfigured,
  signSuperadminSession,
  SUPERADMIN_COOKIE,
  superadminCookieOptions,
} from "@/lib/superadmin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSuperadminConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not set on the server." },
      { status: 503 },
    );
  }
  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const want = process.env.ADMIN_PASSWORD!.trim();
  const got = typeof body.password === "string" ? body.password : "";
  if (!got || got !== want) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const token = await signSuperadminSession();
  if (!token) {
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SUPERADMIN_COOKIE, token, superadminCookieOptions());
  return res;
}
