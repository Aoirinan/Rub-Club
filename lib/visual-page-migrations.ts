import { CONTENT_REGISTRY } from "@/lib/cms-registry";
import { HERO_BLOCK_ID, heroFieldIdsForLayoutPage, layoutPageLabels } from "@/lib/page-builder-cms";
import {
  contentScopeDef,
  type ContentScopeId,
} from "@/lib/page-builder-content-scopes";
import {
  HEADER_BRAND_KEYS,
  HEADER_BRANDING_LAYOUT_DEFAULT,
  headerBrandLayerBoxes,
  mergeBrandFromLayerBoxes,
  type HeaderBrandingLayout,
} from "@/lib/header-branding-cms";
import {
  defaultBlockOrder,
  defaultPageLayout,
  isPageLayoutId,
  pageLayoutDef,
  type PageLayoutId,
} from "@/lib/page-layout";
import {
  fieldTypeToLayerType,
  normalizeVisualPageLayout,
  type VisualSection,
  type VisualLayer,
  type VisualPageLayout,
  type VisualScopeId,
} from "@/lib/visual-page-layout";
import { getContentFieldMeta } from "@/lib/cms-registry";

function stackedLayers(
  items: Omit<VisualLayer, "zIndex">[],
  frameHeight: number,
): VisualPageLayout {
  let y = 2;
  const sections: VisualSection[] = [];
  const layers: VisualLayer[] = items.map((item, i) => {
    if (item.type === "embed" && item.id.startsWith("block_")) {
      const sectionId = item.id.replace(/^block_/, "");
      sections.push({
        id: sectionId,
        label: item.label ?? sectionId,
        y,
        h: item.box.h,
        order: sections.length,
      });
    }
    const layer: VisualLayer = {
      ...item,
      box: { ...item.box, y },
      zIndex: i,
      sectionId:
        item.sectionId ??
        (item.type === "embed" && item.id.startsWith("block_")
          ? item.id.replace(/^block_/, "")
          : undefined),
    };
    y += item.box.h + 1.5;
    return layer;
  });
  const minH = Math.max(400, Math.ceil((y / 100) * 600) + 80);
  return normalizeVisualPageLayout({
    version: 1,
    frameHeight: Math.min(frameHeight, minH),
    sections,
    layers,
  });
}

function cmsFieldLayers(
  fieldIds: string[],
  startY: number,
  colW = 90,
): { layers: Omit<VisualLayer, "zIndex">[]; endY: number } {
  const layers: Omit<VisualLayer, "zIndex">[] = [];
  let y = startY;
  for (const id of fieldIds) {
    const meta = getContentFieldMeta(id);
    if (!meta) continue;
    const type = fieldTypeToLayerType(meta);
    const h = type === "image" ? 18 : type === "richtext" ? 12 : 8;
    layers.push({
      id: `cms_${id}`,
      type,
      label: meta.fieldLabel,
      cmsFieldId: id,
      box: { x: 5, y, w: colW, h },
    });
    y += h + 1;
  }
  return { layers, endY: y };
}

export function buildServicePageVisualLayout(pageId: PageLayoutId): VisualPageLayout {
  const def = pageLayoutDef(pageId);
  const layout = defaultPageLayout(pageId);
  const visible = layout.blockOrder.filter((id) => !layout.hiddenBlocks.includes(id));
  const items: Omit<VisualLayer, "zIndex">[] = [];

  items.push({
    id: HERO_BLOCK_ID,
    type: "embed",
    label: "Page hero",
    embedKey: "hero",
    blockId: HERO_BLOCK_ID,
    box: { x: 2, y: 2, w: 96, h: 14 },
  });

  let y = 18;
  for (const blockId of visible.length > 0 ? visible : defaultBlockOrder(pageId)) {
    const block = def.blocks.find((b) => b.id === blockId);
    if (!block) continue;
    const blockH = block.previewKey === "introPhoto" ? 28 : block.embedKey ? 22 : 16;
    items.push({
      id: `block_${blockId}`,
      type: "embed",
      label: block.label,
      blockId,
      embedKey: block.embedKey,
      box: { x: 2, y, w: 96, h: blockH },
    });

    if (block.cmsFieldIds?.length) {
      const { layers: fieldLayers, endY } = cmsFieldLayers(block.cmsFieldIds, y + 1, 44);
      for (const fl of fieldLayers) {
        items.push({
          ...fl,
          sectionId: blockId,
          box: { ...fl.box, x: 52, w: 44 },
        });
      }
      y = Math.max(y + blockH, endY) + 2;
    } else {
      y += blockH + 2;
    }
  }

  const heroIds = heroFieldIdsForLayoutPage(pageId);
  const heroLayers = cmsFieldLayers(heroIds, 4, 40).layers;
  for (const h of heroLayers) {
    items.push({ ...h, box: { ...h.box, x: 55, w: 40, h: 6 } });
  }

  return stackedLayers(items, 2400);
}

export function buildContentScopeVisualLayout(scopeId: ContentScopeId): VisualPageLayout {
  const def = contentScopeDef(scopeId);
  const items: Omit<VisualLayer, "zIndex">[] = [];
  let y = 2;

  for (const section of def.sections) {
    items.push({
      id: `section_${section.id}`,
      type: "embed",
      label: section.label,
      blockId: section.id,
      box: { x: 2, y, w: 96, h: 6 },
    });
    y += 7;
    const { layers, endY } = cmsFieldLayers(section.fieldIds, y, 92);
    for (const fl of layers) {
      items.push({ ...fl, sectionId: section.id });
    }
    y = endY + 3;
  }

  return stackedLayers(items, Math.max(600, y * 8));
}

export function buildHeaderBrandingVisualLayout(
  headerLayout?: HeaderBrandingLayout,
): VisualPageLayout {
  const layout = headerLayout ?? HEADER_BRANDING_LAYOUT_DEFAULT;
  const layers: VisualLayer[] = [];
  let z = 0;
  for (const key of HEADER_BRAND_KEYS) {
    const boxes = headerBrandLayerBoxes(layout, key);
    layers.push({
      id: `brand_logo_${key}`,
      type: "embed" as const,
      label: `${key} logo`,
      embedKey: "header-logo",
      brandKey: key,
      box: { ...boxes.logo },
      zIndex: z++,
      iconScale: boxes.logo.iconScale ?? layout.brands[key].iconScale,
      sectionId: "header_branding",
    });
    layers.push({
      id: `brand_text_${key}`,
      type: "embed" as const,
      label: `${key} text`,
      embedKey: "header-text",
      brandKey: key,
      box: { ...boxes.text },
      zIndex: z++,
      sectionId: "header_branding",
    });
  }
  return normalizeVisualPageLayout({
    version: 1,
    frameHeight: layout.frameHeight,
    sections: [
      {
        id: "header_branding",
        label: "Header branding",
        y: 0,
        h: 100,
        order: 0,
      },
    ],
    layers,
  });
}

export function headerVisualToBrandingLayout(visual: VisualPageLayout): HeaderBrandingLayout {
  const brands = {} as HeaderBrandingLayout["brands"];
  const logoBoxes = {} as NonNullable<HeaderBrandingLayout["logoBoxes"]>;
  const textBoxes = {} as NonNullable<HeaderBrandingLayout["textBoxes"]>;
  for (const key of HEADER_BRAND_KEYS) {
    const logoLayer = visual.layers.find(
      (l) => l.brandKey === key && (l.embedKey === "header-logo" || l.id === `brand_logo_${key}`),
    );
    const textLayer = visual.layers.find(
      (l) => l.brandKey === key && (l.embedKey === "header-text" || l.id === `brand_text_${key}`),
    );
    const fallback = HEADER_BRANDING_LAYOUT_DEFAULT.brands[key];
    const legacyLayer = visual.layers.find((l) => l.brandKey === key && !l.embedKey);

    const logo = logoLayer
      ? {
          x: logoLayer.box.x,
          y: logoLayer.box.y,
          w: logoLayer.box.w,
          h: logoLayer.box.h,
          ...(logoLayer.iconScale !== undefined ? { iconScale: logoLayer.iconScale } : {}),
        }
      : legacyLayer
        ? {
            x: legacyLayer.box.x,
            y: legacyLayer.box.y,
            w: legacyLayer.box.w,
            h: legacyLayer.box.h,
            ...(legacyLayer.iconScale !== undefined ? { iconScale: legacyLayer.iconScale } : {}),
          }
        : headerBrandLayerBoxes({ ...HEADER_BRANDING_LAYOUT_DEFAULT, brands }, key).logo;

    const text = textLayer
      ? {
          x: textLayer.box.x,
          y: textLayer.box.y,
          w: textLayer.box.w,
          h: textLayer.box.h,
        }
      : headerBrandLayerBoxes({ ...HEADER_BRANDING_LAYOUT_DEFAULT, brands }, key).text;

    logoBoxes[key] = logo;
    textBoxes[key] = text;
    brands[key] = mergeBrandFromLayerBoxes(logo, text, fallback);
  }
  return {
    version: 1,
    frameHeight: visual.frameHeight,
    brands,
    logoBoxes,
    textBoxes,
  };
}

export function buildDefaultVisualLayoutForScope(scope: VisualScopeId): VisualPageLayout {
  if (scope === "header-branding") {
    return buildHeaderBrandingVisualLayout();
  }
  if (isPageLayoutId(scope)) {
    return buildServicePageVisualLayout(scope);
  }
  return buildContentScopeVisualLayout(scope);
}

/** Visible block order derived from embed layers on service pages. */
export function blockOrderFromVisual(visual: VisualPageLayout, pageId: PageLayoutId): string[] {
  const allowed = new Set(pageLayoutDef(pageId).blocks.map((b) => b.id));
  const fromLayers = visual.layers
    .filter((l) => l.type === "embed" && l.blockId && l.blockId !== HERO_BLOCK_ID && !l.hidden)
    .map((l) => l.blockId!)
    .filter((id) => allowed.has(id));
  const unique: string[] = [];
  for (const id of fromLayers) {
    if (!unique.includes(id)) unique.push(id);
  }
  return unique.length > 0 ? unique : defaultBlockOrder(pageId);
}

export function hiddenBlocksFromVisual(visual: VisualPageLayout, pageId: PageLayoutId): string[] {
  const onPage = new Set(blockOrderFromVisual(visual, pageId));
  const all = pageLayoutDef(pageId).blocks.map((b) => b.id);
  return all.filter((id) => !onPage.has(id));
}

export function allRegistryFieldsForScope(scope: VisualScopeId): string[] {
  if (isPageLayoutId(scope)) {
    const labels = layoutPageLabels(scope);
    return CONTENT_REGISTRY.filter((f) => labels.includes(f.pageLabel)).map((f) => f.id);
  }
  const def = contentScopeDef(scope as ContentScopeId);
  return def.sections.flatMap((s) => s.fieldIds);
}
