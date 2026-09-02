import { NextResponse } from "next/server";
import { assertRateLimitOk } from "@/lib/rate-limit";
import {
  isSuperadminConfigured,
  secretsMatch,
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
  const rl = await assertRateLimitOk(req.headers, { bucket: "superadmin-login", maxPerWindow: 10 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
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
  if (!got || !(await secretsMatch(got, want))) {
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
