import { readFileSync } from "fs";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { listMassageTherapistsForOwnerMarketing } from "@/lib/massage-therapist-options";
import { buildOwnerVideoQuotaSnapshot } from "@/lib/owner-upload-quota";
import { getFirestore } from "@/lib/firebase-admin";
import { mergeHeaderColors, validateHeaderColorConfig } from "@/lib/header-colors";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch, type SiteOwnerSingleton } from "@/lib/site-owner-config";
import { authorizeOwnerMarketing, unauthorizedOwnerMarketing } from "@/lib/owner-marketing-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const marketingAuth = await authorizeOwnerMarketing(req);
  if (!marketingAuth.ok) return unauthorizedOwnerMarketing();
  const config = await getSiteOwnerConfig();
  let massageTeamMembers: { id: string; name: string }[] = [];
  let massageTherapistSource: "team" | "providers" | null = null;
  try {
    const listed = await listMassageTherapistsForOwnerMarketing(getFirestore());
    massageTeamMembers = listed.members;
    massageTherapistSource = listed.source;
  } catch {
    massageTeamMembers = [];
    massageTherapistSource = null;
  }
  const videoQuota = buildOwnerVideoQuotaSnapshot(config);
  let appVersion = "";
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    appVersion = typeof pkg.version === "string" ? pkg.version : "";
  } catch {
    /* ignore */
  }
  return NextResponse.json({
    config,
    appVersion,
    massageTeamMembers,
    massageTherapistSource,
    videoQuota,
  });
}

export async function PATCH(req: Request) {
  const marketingAuth = await authorizeOwnerMarketing(req);
  if (!marketingAuth.ok) return unauthorizedOwnerMarketing();
  let patch: Partial<SiteOwnerSingleton>;
  try {
    patch = (await req.json()) as Partial<SiteOwnerSingleton>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (patch.headerColors !== undefined) {
    const merged = mergeHeaderColors(patch.headerColors);
    const validation = validateHeaderColorConfig(merged);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    patch = { ...patch, headerColors: merged };
  }
  const next = await setSiteOwnerConfigPatch(patch);
  if (patch.headerColors !== undefined) {
    revalidatePath("/", "layout");
  }
  return NextResponse.json({ config: next });
}
