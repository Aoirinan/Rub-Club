import { NextResponse } from "next/server";
import { deleteOwnerMarketingObject } from "@/lib/owner-marketing-upload";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch } from "@/lib/site-owner-config";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSuperadminRequest(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const cur = await getSiteOwnerConfig();
  const found = cur.testimonialVideos.find((v) => v.id === id);
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (found.storagePath) {
    await deleteOwnerMarketingObject(found.storagePath).catch(() => {});
  }
  await setSiteOwnerConfigPatch({
    testimonialVideos: cur.testimonialVideos.filter((v) => v.id !== id),
  });
  return NextResponse.json({ ok: true });
}
