import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DOMAIN_CTX_COOKIE = "rub_domain_ctx";

export type DomainContextValue = "massage" | "chiro" | "default";

function resolveDomainContext(host: string, utm: string | null): DomainContextValue {
  const h = host.toLowerCase();
  const u = (utm ?? "").toLowerCase();
  if (
    h === "massageparistexas.com" ||
    h === "www.massageparistexas.com" ||
    u === "massageparistexas" ||
    u === "massage"
  ) {
    return "massage";
  }
  if (
    h === "chiropracticsulphursprings.com" ||
    h === "www.chiropracticsulphursprings.com" ||
    u === "chiropracticsulphursprings" ||
    u === "chiro"
  ) {
    return "chiro";
  }
  return "default";
}

export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const utmRaw = request.nextUrl.searchParams.get("utm_source");
  const utm = utmRaw?.toLowerCase() ?? null;

  let ctx = resolveDomainContext(host, utmRaw);
  if (utm === "massage" || utm === "massageparistexas") ctx = "massage";
  if (utm === "chiro" || utm === "chiropracticsulphursprings") ctx = "chiro";

  const prev = request.cookies.get(DOMAIN_CTX_COOKIE)?.value;
  if (!prev || utm) {
    res.cookies.set(DOMAIN_CTX_COOKIE, ctx, cookieOpts());
  }

  return res;
}

function cookieOpts() {
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf)$).*)"],
};
