import { NextResponse } from "next/server";
import { deleteOwnerMarketingObject } from "@/lib/owner-marketing-upload";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch } from "@/lib/site-owner-config";
import { authorizeOwnerMarketing, unauthorizedOwnerMarketing } from "@/lib/owner-marketing-auth";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const marketingAuth = await authorizeOwnerMarketing(req);
  if (!marketingAuth.ok) return unauthorizedOwnerMarketing();
  const { id } = await ctx.params;
  const cur = await getSiteOwnerConfig();
  const found = cur.doctorMedia.find((d) => d.id === id);
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (found.storagePath) {
    await deleteOwnerMarketingObject(found.storagePath).catch(() => {});
  }
  await setSiteOwnerConfigPatch({
    doctorMedia: cur.doctorMedia.filter((d) => d.id !== id),
  });
  return NextResponse.json({ ok: true });
}
