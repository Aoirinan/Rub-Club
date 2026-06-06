import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  BUSINESS_CTX_COOKIE,
  businessContextCookieValue,
} from "@/lib/site-business-context";
import {
  DOMAIN_CTX_COOKIE,
  type DomainContextValue,
} from "@/lib/domain-context";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export type { DomainContextValue };

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

async function blockSuperadminApi(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/superadmin")) return null;
  if (pathname === "/api/superadmin/login" && request.method === "POST") return null;
  if (pathname === "/api/superadmin/logout" && request.method === "POST") return null;
  // Firebase staff tokens are verified in route handlers (authorizeOwnerMarketing).
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return null;
  const cookieHeader = request.headers.get("cookie");
  if (!(await isSuperadminRequest(cookieHeader))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const apiBlock = await blockSuperadminApi(request);
  if (apiBlock) return apiBlock;

  // Legacy secondary-domain redirects are handled by next.config.ts `redirects()`
  // (catch-all, cross-domain, permanent). This middleware only resolves the
  // domain-context cookie used for themed specials.
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  const res = NextResponse.next();
  const utmRaw = request.nextUrl.searchParams.get("utm_source");
  const utm = utmRaw?.toLowerCase() ?? null;

  let ctx = resolveDomainContext(host, utmRaw);
  if (utm === "massage" || utm === "massageparistexas") ctx = "massage";
  if (utm === "chiro" || utm === "chiropracticsulphursprings") ctx = "chiro";

  const prev = request.cookies.get(DOMAIN_CTX_COOKIE)?.value;
  if (!prev || utm) {
    res.cookies.set(DOMAIN_CTX_COOKIE, ctx, cookieOpts());
  }

  const { pathname } = request.nextUrl;
  const businessCtx = businessContextCookieValue(pathname);
  if (businessCtx) {
    res.cookies.set(BUSINESS_CTX_COOKIE, businessCtx, cookieOpts());
  } else {
    res.cookies.delete(BUSINESS_CTX_COOKIE);
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
