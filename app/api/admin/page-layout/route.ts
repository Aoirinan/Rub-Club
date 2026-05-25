import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PAGE_LAYOUT_PAGES,
  PAGE_LAYOUT_REVALIDATE_PATHS,
  isPageLayoutId,
  pageLayoutDef,
  paletteBlockIds,
} from "@/lib/page-layout";
import { getPageLayout, savePageLayout } from "@/lib/page-layout-db";
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
  const layout = await getPageLayout(pageRaw);
  const def = pageLayoutDef(pageRaw);
  return NextResponse.json({
    page: def,
    blockOrder: layout.blockOrder,
    hiddenBlocks: layout.hiddenBlocks,
    paletteBlocks: paletteBlockIds(pageRaw, layout.blockOrder),
    blocks: def.blocks,
  });
}

const patchSchema = z.object({
  page: z.enum(["massage", "sulphur-springs", "chiropractic"]),
  blockOrder: z.array(z.string()),
  hiddenBlocks: z.array(z.string()).optional(),
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
  const saved = await savePageLayout(
    parsed.data.page,
    {
      blockOrder: parsed.data.blockOrder,
      hiddenBlocks: parsed.data.hiddenBlocks ?? [],
    },
    staff.email ?? staff.uid,
  );
  revalidatePath(PAGE_LAYOUT_REVALIDATE_PATHS[parsed.data.page]);
  return NextResponse.json({
    ok: true,
    blockOrder: saved.blockOrder,
    hiddenBlocks: saved.hiddenBlocks,
    paletteBlocks: paletteBlockIds(parsed.data.page, saved.blockOrder),
  });
}
