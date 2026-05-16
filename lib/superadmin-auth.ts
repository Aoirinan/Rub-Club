export const SUPERADMIN_COOKIE = "rub_superadmin_session";

const SESSION_MAX_SEC = 60 * 60 * 24 * 7;
const textEncoder = new TextEncoder();

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD?.trim();
  return p && p.length > 0 ? p : null;
}

export function isSuperadminConfigured(): boolean {
  return Boolean(adminPassword());
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, textEncoder.encode(message));
  return Buffer.from(new Uint8Array(sig)).toString("base64url");
}

function timingSafeEqualBase64Url(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function signSuperadminSession(): Promise<string | null> {
  const pw = adminPassword();
  if (!pw) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_SEC;
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString("base64url");
  const sig = await hmacSha256Base64Url(pw, payload);
  return `${payload}.${sig}`;
}

export async function verifySuperadminSessionToken(token: string): Promise<boolean> {
  const pw = adminPassword();
  if (!pw) return false;
  const idx = token.indexOf(".");
  if (idx <= 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!payload || !sig) return false;
  const expected = await hmacSha256Base64Url(pw, payload);
  if (!timingSafeEqualBase64Url(sig, expected)) return false;
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

export async function isSuperadminRequest(cookieHeader: string | null): Promise<boolean> {
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
