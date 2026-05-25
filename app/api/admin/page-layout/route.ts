import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PAGE_LAYOUT_PAGES,
  isPageLayoutId,
  normalizeBlockOrder,
  pageLayoutDef,
} from "@/lib/page-layout";
import { getPageBlockOrder, savePageBlockOrder } from "@/lib/page-layout-db";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pageRaw = new URL(req.url).searchParams.get("page");
  if (!pageRaw || !isPageLayoutId(pageRaw)) {
    return NextResponse.json({
      pages: PAGE_LAYOUT_PAGES.map((p) => ({
        id: p.id,
        label: p.label,
        path: p.path,
        blocks: p.blocks,
      })),
    });
  }
  const blockOrder = await getPageBlockOrder(pageRaw);
  const def = pageLayoutDef(pageRaw);
  return NextResponse.json({
    page: def,
    blockOrder,
    blocks: def.blocks,
  });
}

const patchSchema = z.object({
  page: z.enum(["massage", "sulphur-springs", "chiropractic"]),
  blockOrder: z.array(z.string()),
});

export async function PATCH(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const normalized = normalizeBlockOrder(parsed.data.page, parsed.data.blockOrder);
  const saved = await savePageBlockOrder(
    parsed.data.page,
    normalized,
    staff.email ?? staff.uid,
  );
  return NextResponse.json({ ok: true, blockOrder: saved });
}
