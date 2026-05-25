import type { ContentFieldMeta } from "@/lib/cms-registry";

export const HEADER_BRANDING_LAYOUT_FIELD = "header_branding_layout" as const;

/** Legacy height fields — used for migration only. */
export const HEADER_BRANDING_LEGACY_FIELD_IDS = [
  "rub_logo_height_side",
  "rub_logo_height_center",
  "chiro_logo_height_side",
  "chiro_logo_height_center",
  "ss_logo_height_side",
  "ss_logo_height_center",
  "ss_logo_icon_scale",
] as const;

export type HeaderBrandKey = "rub" | "chiro" | "ss";

export const HEADER_BRAND_KEYS: HeaderBrandKey[] = ["rub", "chiro", "ss"];

export type HeaderBrandBox = {
  /** 0–100, percent of frame width */
  x: number;
  /** 0–100, percent of frame height */
  y: number;
  w: number;
  h: number;
  iconScale?: number;
};

export type HeaderBrandingLayout = {
  version: 1;
  frameHeight: number;
  brands: Record<HeaderBrandKey, HeaderBrandBox>;
};

export const HEADER_BRANDING_LAYOUT_DEFAULT: HeaderBrandingLayout = {
  version: 1,
  frameHeight: 132,
  brands: {
    chiro: { x: 1, y: 2, w: 30, h: 52 },
    rub: { x: 33, y: 0, w: 34, h: 58 },
    ss: { x: 67, y: 2, w: 31, h: 52, iconScale: 88 },
  },
};

const BOX_W_MIN = 8;
const BOX_W_MAX = 70;
const BOX_H_MIN = 20;
const BOX_H_MAX = 90;
const FRAME_H_MIN = 96;
const FRAME_H_MAX = 220;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function clampBox(box: HeaderBrandBox): HeaderBrandBox {
  return {
    x: clamp(box.x, 0, 100 - BOX_W_MIN),
    y: clamp(box.y, 0, 100 - BOX_H_MIN),
    w: clamp(box.w, BOX_W_MIN, BOX_W_MAX),
    h: clamp(box.h, BOX_H_MIN, BOX_H_MAX),
    ...(box.iconScale !== undefined
      ? { iconScale: clamp(box.iconScale, 60, 100) }
      : {}),
  };
}

export function normalizeHeaderBrandingLayout(raw: HeaderBrandingLayout): HeaderBrandingLayout {
  const frameHeight = clamp(raw.frameHeight, FRAME_H_MIN, FRAME_H_MAX);
  const brands = {} as Record<HeaderBrandKey, HeaderBrandBox>;
  for (const key of HEADER_BRAND_KEYS) {
    const b = raw.brands[key] ?? HEADER_BRANDING_LAYOUT_DEFAULT.brands[key];
    brands[key] = clampBox(b);
  }
  return { version: 1, frameHeight, brands };
}

function layoutFromLegacyHeights(cms: Partial<Record<string, string>>): HeaderBrandingLayout {
  const parseH = (id: string, fallback: number) => {
    const n = parseInt(String(cms[id] ?? "").trim(), 10);
    return Number.isFinite(n) ? clamp(n, 20, 120) : fallback;
  };
  const frameHeight = 132;
  const hToPct = (px: number) => clamp((px / frameHeight) * 100 * 0.55, BOX_H_MIN, BOX_H_MAX);

  const rubH = hToPct(parseH("rub_logo_height_center", 64));
  const chiroH = hToPct(parseH("chiro_logo_height_side", 36));
  const ssH = hToPct(parseH("ss_logo_height_side", 36));
  const iconScale = clamp(parseH("ss_logo_icon_scale", 88), 60, 100);

  return normalizeHeaderBrandingLayout({
    version: 1,
    frameHeight,
    brands: {
      chiro: { x: 1, y: 2, w: 30, h: chiroH },
      rub: { x: 33, y: 0, w: 34, h: rubH },
      ss: { x: 67, y: 2, w: 31, h: ssH, iconScale },
    },
  });
}

export function parseHeaderBrandingLayout(
  cms: Partial<Record<string, string>>,
): HeaderBrandingLayout {
  const raw = cms[HEADER_BRANDING_LAYOUT_FIELD]?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as HeaderBrandingLayout;
      if (parsed?.version === 1 && parsed.brands) {
        return normalizeHeaderBrandingLayout(parsed);
      }
    } catch {
      /* fall through to migration */
    }
  }

  const hasLegacy = HEADER_BRANDING_LEGACY_FIELD_IDS.some((id) => cms[id]?.trim());
  if (hasLegacy) {
    return layoutFromLegacyHeights(cms);
  }

  return HEADER_BRANDING_LAYOUT_DEFAULT;
}

export function serializeHeaderBrandingLayout(layout: HeaderBrandingLayout): string {
  return JSON.stringify(normalizeHeaderBrandingLayout(layout));
}

export const HEADER_BRANDING_FIELD_IDS = [
  HEADER_BRANDING_LAYOUT_FIELD,
  ...HEADER_BRANDING_LEGACY_FIELD_IDS,
] as const;

/** @deprecated Use HeaderBrandingLayout */
export type HeaderBrandingHeights = {
  rub: { side: number; center: number };
  chiro: { side: number; center: number };
  ss: { side: number; center: number; iconScalePercent: number };
};

export function buildHeaderBrandingCmsRegistry(): ContentFieldMeta[] {
  return [
    {
      id: HEADER_BRANDING_LAYOUT_FIELD,
      pageLabel: "Header branding",
      sectionLabel: "Layout",
      fieldLabel: "Logo positions (JSON)",
      type: "text",
    },
    ...HEADER_BRANDING_LEGACY_FIELD_IDS.map((id) => ({
      id,
      pageLabel: "Header branding" as const,
      sectionLabel: "Legacy",
      fieldLabel: id,
      type: "text" as const,
    })),
  ];
}

export function buildHeaderBrandingCmsDefaults(): Record<string, string> {
  return {
    [HEADER_BRANDING_LAYOUT_FIELD]: serializeHeaderBrandingLayout(HEADER_BRANDING_LAYOUT_DEFAULT),
    rub_logo_height_side: "36",
    rub_logo_height_center: "64",
    chiro_logo_height_side: "36",
    chiro_logo_height_center: "64",
    ss_logo_height_side: "36",
    ss_logo_height_center: "64",
    ss_logo_icon_scale: "88",
  };
}

export const BRAND_LABELS: Record<HeaderBrandKey, string> = {
  rub: "Rub Club (massage)",
  chiro: "Chiropractic — Paris",
  ss: "Sulphur Springs",
};
