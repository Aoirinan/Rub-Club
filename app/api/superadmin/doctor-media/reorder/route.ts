import { NextResponse } from "next/server";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch } from "@/lib/site-owner-config";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSuperadminRequest(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { orderedIds?: string[] };
  try {
    body = (await req.json()) as { orderedIds?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ids = body.orderedIds;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
  }
  const cur = await getSiteOwnerConfig();
  const map = new Map(cur.doctorMedia.map((d) => [d.id, d]));
  const next: typeof cur.doctorMedia = [];
  let order = 0;
  for (const id of ids) {
    const row = map.get(id);
    if (row) {
      next.push({ ...row, sortOrder: order++ });
      map.delete(id);
    }
  }
  let o = order;
  for (const row of map.values()) {
    next.push({ ...row, sortOrder: o++ });
  }
  await setSiteOwnerConfigPatch({ doctorMedia: next });
  return NextResponse.json({ ok: true });
}
