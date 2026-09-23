import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  BUSINESS_CTX_COOKIE,
  businessContextCookieValue,
  isSharedPathname,
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

  // API calls (client fetches for slots, marketing payload, …) carry cookies
  // but are not page navigations: never set or clear the brand-context
  // cookies from them, or a fetch on a Sulphur Springs page would reset the
  // visitor back to the Paris theme.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Legacy secondary-domain redirects are handled by next.config.ts `redirects()`
  // (catch-all, cross-domain, permanent). This middleware only resolves the
  // domain-context cookie used for themed specials.
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  const res = NextResponse.next();

  // Belt-and-braces with the layout's `robots` metadata: keep the *.vercel.app
  // deploy copy out of search while the canonical domain still serves the old
  // site. Also covers robots.txt / sitemap.xml, which carry no meta tag.
  if (host.endsWith(".vercel.app")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  const utmRaw = request.nextUrl.searchParams.get("utm_source");
  const utm = utmRaw?.toLowerCase() ?? null;

  let ctx = resolveDomainContext(host, utmRaw);
  if (utm === "massage" || utm === "massageparistexas") ctx = "massage";
  if (utm === "chiro" || utm === "chiropracticsulphursprings") ctx = "chiro";

  const prev = request.cookies.get(DOMAIN_CTX_COOKIE)?.value;
  if (!prev || utm) {
    res.cookies.set(DOMAIN_CTX_COOKIE, ctx, cookieOpts());
  }

  // Only a real navigation may change the brand cookie. <Link> prefetches
  // (`Next-Router-Prefetch: 1`) and `Purpose: prefetch` requests never reach
  // this code: the `missing` conditions in `config.matcher` below skip them.
  // It must be done there because Next strips `Next-Router-Prefetch`/`RSC`
  // from the headers middleware code sees, so checking them here is always
  // false — which is how prefetching the header's Paris links used to clear
  // a Sulphur Springs visitor's cookie and show Paris on /contact and /book.
  // `Sec-Purpose` (browser speculation rules, <link rel="prefetch">) is not
  // stripped and not excluded by the matcher, so it is still checked here.
  const isBrowserPrefetch = request.headers.get("sec-purpose")?.includes("prefetch") ?? false;

  if (!isBrowserPrefetch) {
    const { pathname } = request.nextUrl;
    const businessCtx = businessContextCookieValue(pathname);
    if (businessCtx) {
      res.cookies.set(BUSINESS_CTX_COOKIE, businessCtx, cookieOpts());
    } else if (!isSharedPathname(pathname)) {
      // Paris-site page (home, massage, …): reset. Shared pages keep the
      // visitor's current site context so the brand color stays put.
      res.cookies.delete(BUSINESS_CTX_COOKIE);
    }
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
  matcher: [
    // The superadmin API gate must run on every request, whatever its headers:
    // the prefetch exclusion below must never become a way around it.
    "/api/superadmin/:path*",
    {
      // robots.txt and sitemap.xml stay matched: on *.vercel.app they need
      // the X-Robots-Tag header set above.
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf|mp4|webm|mov)$).*)",
      // Router prefetches must not touch the brand cookie (see middleware()).
      // Next removes these headers before middleware code runs, so they can
      // only be filtered here, where the original request is matched.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
