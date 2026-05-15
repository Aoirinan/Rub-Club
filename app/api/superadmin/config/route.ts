import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch, type SiteOwnerSingleton } from "@/lib/site-owner-config";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isSuperadminRequest(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config = await getSiteOwnerConfig();
  let appVersion = "";
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    appVersion = typeof pkg.version === "string" ? pkg.version : "";
  } catch {
    /* ignore */
  }
  return NextResponse.json({ config, appVersion });
}

export async function PATCH(req: Request) {
  if (!isSuperadminRequest(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let patch: Partial<SiteOwnerSingleton>;
  try {
    patch = (await req.json()) as Partial<SiteOwnerSingleton>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const next = await setSiteOwnerConfigPatch(patch);
  return NextResponse.json({ config: next });
}
