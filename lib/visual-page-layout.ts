import type { PageBuilderScopeId } from "@/lib/page-builder-content-scopes";
import { isFaqItemsScope, isPageBuilderScopeId } from "@/lib/page-builder-content-scopes";
import type { ContentFieldMeta } from "@/lib/cms-registry";
import { getContentFieldMeta } from "@/lib/cms-registry";

export type VisualLayerType = "text" | "richtext" | "image" | "embed";

export type VisualLayerBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type VisualLayer = {
  id: string;
  type: VisualLayerType;
  label?: string;
  box: VisualLayerBox;
  zIndex: number;
  sectionId?: string;
  locked?: boolean;
  hidden?: boolean;
  cmsFieldId?: string;
  embedKey?: string;
  blockId?: string;
  content?: string;
  src?: string;
  alt?: string;
  /** Header branding: rub | chiro | ss */
  brandKey?: string;
  iconScale?: number;
};

export type VisualSection = {
  id: string;
  label: string;
  y: number;
  h: number;
  order: number;
};

export type VisualPageLayout = {
  version: 1;
  frameHeight: number;
  sections?: VisualSection[];
  layers: VisualLayer[];
};

export type VisualScopeId = Exclude<PageBuilderScopeId, "faq-items">;

export function isVisualScopeId(v: string): v is VisualScopeId {
  return isPageBuilderScopeId(v) && !isFaqItemsScope(v);
}

const BOX_W_MIN = 4;
const BOX_W_MAX = 98;
const BOX_H_MIN = 3;
const BOX_H_MAX = 95;
const FRAME_H_MIN = 120;
const FRAME_H_MAX = 8000;

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function clampBox(box: VisualLayerBox): VisualLayerBox {
  const w = clamp(box.w, BOX_W_MIN, BOX_W_MAX);
  const h = clamp(box.h, BOX_H_MIN, BOX_H_MAX);
  return {
    x: clamp(box.x, 0, 100 - w),
    y: clamp(box.y, 0, 100 - h),
    w,
    h,
  };
}

export function normalizeVisualPageLayout(raw: VisualPageLayout): VisualPageLayout {
  const frameHeight = clamp(raw.frameHeight, FRAME_H_MIN, FRAME_H_MAX);
  const sections = (raw.sections ?? [])
    .filter((s) => s?.id && typeof s.id === "string")
    .map((s, i) => ({
      id: s.id,
      label: s.label || s.id,
      y: clamp(typeof s.y === "number" ? s.y : 0, 0, 97),
      h: clamp(typeof s.h === "number" ? s.h : 12, 3, 97),
      order: typeof s.order === "number" ? s.order : i,
    }))
    .sort((a, b) => a.order - b.order);
  const layers = (raw.layers ?? [])
    .filter((l) => l?.id && typeof l.id === "string")
    .map((l, i) => {
      const box = clampBox(l.box ?? { x: 0, y: 0, w: 40, h: 10 });
      return {
        id: l.id,
        type: l.type ?? "text",
        label: l.label,
        box,
        zIndex: typeof l.zIndex === "number" ? l.zIndex : i,
        sectionId: l.sectionId,
        locked: Boolean(l.locked),
        hidden: Boolean(l.hidden),
        cmsFieldId: l.cmsFieldId,
        embedKey: l.embedKey,
        blockId: l.blockId,
        content: l.content,
        src: l.src,
        alt: l.alt,
        brandKey: l.brandKey,
        iconScale: l.iconScale !== undefined ? clamp(l.iconScale, 60, 100) : undefined,
      } satisfies VisualLayer;
    })
    .sort((a, b) => a.zIndex - b.zIndex);
  return { version: 1, frameHeight, sections, layers };
}

export function parseVisualPageLayout(
  raw: unknown,
  scope: VisualScopeId,
  fallback: VisualPageLayout,
): VisualPageLayout {
  if (raw && typeof raw === "object" && (raw as VisualPageLayout).version === 1) {
    return normalizeVisualPageLayout(raw as VisualPageLayout);
  }
  return fallback;
}

export function layoutsEqualVisual(a: VisualPageLayout, b: VisualPageLayout): boolean {
  return JSON.stringify(normalizeVisualPageLayout(a)) === JSON.stringify(normalizeVisualPageLayout(b));
}

export function newLayerId(): string {
  return `layer_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function fieldTypeToLayerType(meta: ContentFieldMeta | undefined): VisualLayerType {
  if (!meta) return "text";
  if (meta.type === "image") return "image";
  if (meta.type === "richtext") return "richtext";
  return "text";
}

export function layerLabel(layer: VisualLayer, cms?: Record<string, string>): string {
  if (layer.label) return layer.label;
  if (layer.cmsFieldId) {
    const meta = getContentFieldMeta(layer.cmsFieldId);
    if (meta) return meta.fieldLabel;
  }
  if (layer.blockId) return `Section: ${layer.blockId}`;
  if (layer.brandKey) return `Logo: ${layer.brandKey}`;
  if (layer.type === "text" || layer.type === "richtext") {
    const t = (layer.content ?? cms?.[layer.cmsFieldId ?? ""] ?? "").slice(0, 40);
    return t || "Text";
  }
  if (layer.type === "image") return "Image";
  return layer.id;
}

export const VISUAL_SCOPE_REVALIDATE_PATHS: Partial<Record<VisualScopeId, string>> = {
  massage: "/services/massage",
  chiropractic: "/services/chiropractic",
  "sulphur-springs": "/sulphur-springs",
  home: "/",
  footer: "/",
  navigation: "/",
  about: "/about",
  contact: "/contact",
  wellness: "/wellness-care-plans",
  insurance: "/insurance",
  reviews: "/reviews",
  "patient-forms": "/patient-forms",
  "faq-copy": "/faq",
  "services-hub": "/services",
  "paris-chiro-pages": "/services/chiropractic",
};
