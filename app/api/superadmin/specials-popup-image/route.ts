import { NextResponse } from "next/server";
import { deleteOwnerMarketingObject } from "@/lib/owner-marketing-upload";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch, type SpecialsConfig, type SpecialsPopupVariant } from "@/lib/site-owner-config";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

const VARIANT_FIELDS: Record<
  SpecialsPopupVariant,
  { urlKey: keyof SpecialsConfig; pathKey: keyof SpecialsConfig }
> = {
  massage: { urlKey: "massageImageUrl", pathKey: "massageImageStoragePath" },
  chiro: { urlKey: "chiroImageUrl", pathKey: "chiroImageStoragePath" },
  general: { urlKey: "generalImageUrl", pathKey: "generalImageStoragePath" },
};

function parseVariant(raw: string | null): SpecialsPopupVariant | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "massage" || v === "chiro" || v === "general") return v;
  return null;
}

export async function DELETE(req: Request) {
  if (!(await isSuperadminRequest(req.headers.get("cookie")))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const variant = parseVariant(url.searchParams.get("variant"));
  if (!variant) {
    return NextResponse.json({ error: "variant query must be massage, chiro, or general" }, { status: 400 });
  }
  const cur = await getSiteOwnerConfig();
  const { urlKey, pathKey } = VARIANT_FIELDS[variant];
  const prevPath = cur.specials[pathKey];
  if (typeof prevPath === "string" && prevPath.trim()) {
    await deleteOwnerMarketingObject(prevPath.trim()).catch(() => {});
  }
  const nextSpecials: SpecialsConfig = {
    ...cur.specials,
    [urlKey]: "",
    [pathKey]: "",
  };
  await setSiteOwnerConfigPatch({ specials: nextSpecials });
  return NextResponse.json({ ok: true, specials: nextSpecials });
}
