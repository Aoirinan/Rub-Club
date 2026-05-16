import { NextResponse } from "next/server";
import { deleteOwnerMarketingObject, uploadOwnerSpecialsPopupImage } from "@/lib/owner-marketing-upload";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch, type SpecialsConfig, type SpecialsPopupVariant } from "@/lib/site-owner-config";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

function isFile(v: FormDataEntryValue | null): v is File {
  return v !== null && typeof v === "object" && "arrayBuffer" in (v as Blob);
}

const VARIANT_FIELDS: Record<
  SpecialsPopupVariant,
  { urlKey: keyof SpecialsConfig; pathKey: keyof SpecialsConfig }
> = {
  massage: { urlKey: "massageImageUrl", pathKey: "massageImageStoragePath" },
  chiro: { urlKey: "chiroImageUrl", pathKey: "chiroImageStoragePath" },
  general: { urlKey: "generalImageUrl", pathKey: "generalImageStoragePath" },
};

function parseVariant(raw: string): SpecialsPopupVariant | null {
  const v = raw.trim().toLowerCase();
  if (v === "massage" || v === "chiro" || v === "general") return v;
  return null;
}

export async function POST(req: Request) {
  if (!(await isSuperadminRequest(req.headers.get("cookie")))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const fd = await req.formData();
  const file = fd.get("file");
  const variant = parseVariant(String(fd.get("variant") ?? ""));
  if (!isFile(file)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!variant) {
    return NextResponse.json({ error: "variant must be massage, chiro, or general" }, { status: 400 });
  }
  const contentType = file.type || "application/octet-stream";
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const { url, storagePath } = await uploadOwnerSpecialsPopupImage({
      buffer: buf,
      contentType,
    });
    const cur = await getSiteOwnerConfig();
    const { urlKey, pathKey } = VARIANT_FIELDS[variant];
    const prevPath = cur.specials[pathKey];
    if (typeof prevPath === "string" && prevPath.trim()) {
      await deleteOwnerMarketingObject(prevPath.trim()).catch(() => {});
    }
    const nextSpecials: SpecialsConfig = {
      ...cur.specials,
      [urlKey]: url,
      [pathKey]: storagePath,
    };
    await setSiteOwnerConfigPatch({ specials: nextSpecials });
    return NextResponse.json({ ok: true, specials: nextSpecials });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
