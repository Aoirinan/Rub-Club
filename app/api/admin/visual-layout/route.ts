import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isPageLayoutId } from "@/lib/page-layout";
import { savePageLayout } from "@/lib/page-layout-db";
import {
  blockOrderFromVisual,
  buildDefaultVisualLayoutForScope,
  hiddenBlocksFromVisual,
} from "@/lib/visual-page-migrations";
import {
  isVisualScopeId,
  normalizeVisualPageLayout,
  VISUAL_SCOPE_REVALIDATE_PATHS,
  type VisualPageLayout,
} from "@/lib/visual-page-layout";
import { getVisualPageLayout, saveVisualPageLayout } from "@/lib/visual-page-layout-db";
import { requireStaff } from "@/lib/staff-auth";
import { PAGE_LAYOUT_PAGES } from "@/lib/page-layout";
import { CONTENT_SCOPES } from "@/lib/page-builder-content-scopes";

export const runtime = "nodejs";

const layerSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "richtext", "image", "embed"]),
  label: z.string().optional(),
  box: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  zIndex: z.number(),
  hidden: z.boolean().optional(),
  cmsFieldId: z.string().optional(),
  embedKey: z.string().optional(),
  blockId: z.string().optional(),
  content: z.string().optional(),
  src: z.string().optional(),
  alt: z.string().optional(),
  brandKey: z.string().optional(),
  iconScale: z.number().optional(),
});

const layoutSchema = z.object({
  version: z.literal(1),
  frameHeight: z.number(),
  layers: z.array(layerSchema),
});

const patchSchema = z.object({
  scope: z.string(),
  layout: layoutSchema,
});

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scopeRaw = new URL(req.url).searchParams.get("scope");
  if (!scopeRaw) {
    return NextResponse.json({
      scopes: [
        ...PAGE_LAYOUT_PAGES.map((p) => ({ id: p.id, label: p.label, kind: "layout" })),
        ...CONTENT_SCOPES.map((s) => ({ id: s.id, label: s.label, kind: "content" })),
      ],
    });
  }

  if (!isVisualScopeId(scopeRaw)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const layout = await getVisualPageLayout(scopeRaw);
  const defaultLayout = buildDefaultVisualLayoutForScope(scopeRaw);
  return NextResponse.json({ scope: scopeRaw, layout, defaultLayout });
}

export async function PATCH(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid layout" }, { status: 400 });
  }

  const { scope, layout } = parsed.data;
  if (!isVisualScopeId(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const normalized = normalizeVisualPageLayout(layout as VisualPageLayout);
  const saved = await saveVisualPageLayout(scope, normalized, staff.email ?? staff.uid);

  if (isPageLayoutId(scope)) {
    await savePageLayout(
      scope,
      {
        blockOrder: blockOrderFromVisual(saved, scope),
        hiddenBlocks: hiddenBlocksFromVisual(saved, scope),
      },
      staff.email ?? staff.uid,
    );
  }

  const path = VISUAL_SCOPE_REVALIDATE_PATHS[scope];
  if (path) revalidatePath(path);

  return NextResponse.json({ scope, layout: saved });
}
