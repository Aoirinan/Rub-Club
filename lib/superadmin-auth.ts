import crypto from "node:crypto";

export const SUPERADMIN_COOKIE = "rub_superadmin_session";

const SESSION_MAX_SEC = 60 * 60 * 24 * 7;

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD?.trim();
  return p && p.length > 0 ? p : null;
}

export function isSuperadminConfigured(): boolean {
  return Boolean(adminPassword());
}

export function signSuperadminSession(): string | null {
  const pw = adminPassword();
  if (!pw) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_SEC;
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", pw).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySuperadminSessionToken(token: string): boolean {
  const pw = adminPassword();
  if (!pw) return false;
  const idx = token.indexOf(".");
  if (idx <= 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!payload || !sig) return false;
  const expected = crypto.createHmac("sha256", pw).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const raw = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof raw.exp === "number" && raw.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function parseCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((s) => s.trim());
  const prefix = `${name}=`;
  for (const p of parts) {
    if (p.startsWith(prefix)) return decodeURIComponent(p.slice(prefix.length));
  }
  return null;
}

export function isSuperadminRequest(cookieHeader: string | null): boolean {
  const tok = parseCookieHeader(cookieHeader, SUPERADMIN_COOKIE);
  if (!tok) return false;
  return verifySuperadminSessionToken(tok);
}

export function superadminCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_SEC,
  };
}
