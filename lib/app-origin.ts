/**
 * Canonical public origin (https://example.com) for server-generated outbound links
 * (Firebase email action `continueUrl`, etc.).
 */
export function getPublicAppOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

function hostnameFromOriginOrUrl(value: string): string | null {
  try {
    const u = value.includes("://") ? new URL(value) : new URL(`https://${value}`);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function trustedAppHostnames(): Set<string> {
  const hosts = new Set<string>(["localhost", "127.0.0.1"]);
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    const h = hostnameFromOriginOrUrl(explicit);
    if (h) hosts.add(h);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const h = hostnameFromOriginOrUrl(vercel);
    if (h) hosts.add(h);
  }
  return hosts;
}

function originFromRequest(req: Request): string | null {
  const origin = req.headers.get("origin")?.trim().replace(/\/$/, "");
  if (origin && /^https?:\/\//i.test(origin)) {
    const host = hostnameFromOriginOrUrl(origin);
    if (host && trustedAppHostnames().has(host)) return origin;
  }
  const referer = req.headers.get("referer")?.trim();
  if (referer) {
    try {
      const u = new URL(referer);
      const host = u.hostname.toLowerCase();
      if (trustedAppHostnames().has(host)) {
        return u.origin;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Prefer the deployment the admin is using (Origin / Referer) when it matches
 * NEXT_PUBLIC_APP_URL or VERCEL_URL, so Firebase password-reset continueUrl
 * matches an authorized domain for that host.
 */
export function getPublicAppOriginForRequest(req: Request): string {
  return originFromRequest(req) ?? getPublicAppOrigin();
}
