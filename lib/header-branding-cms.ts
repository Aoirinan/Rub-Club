import type { ContentFieldMeta } from "@/lib/cms-registry";

export const HEADER_BRANDING_LAYOUT_FIELD = "header_branding_layout" as const;

/** Legacy height fields — used for migration only. */
export const HEADER_BRANDING_LEGACY_FIELD_IDS = [
  "chiro_logo_height_side",
  "chiro_logo_height_center",
  "ss_logo_height_side",
  "ss_logo_height_center",
  "ss_logo_icon_scale",
] as const;

export type HeaderBrandKey = "chiro" | "ss";

export const HEADER_BRAND_KEYS: HeaderBrandKey[] = ["chiro", "ss"];

/** v1 freeform box (legacy data only). */
export type HeaderBrandBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  iconScale?: number;
};

/** v1 split layer box (legacy data only). */
export type HeaderBrandLayerBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  iconScale?: number;
};

/** Legacy freeform layout. Read-only fallback now. */
export type HeaderBrandingLayoutV1 = {
  version: 1;
  frameHeight: number;
  brands: Record<HeaderBrandKey, HeaderBrandBox>;
  logoBoxes?: Record<HeaderBrandKey, HeaderBrandLayerBox>;
  textBoxes?: Record<HeaderBrandKey, HeaderBrandLayerBox>;
};

export const HEADER_PRESETS = ["compact", "standard", "tall"] as const;
export type HeaderPreset = (typeof HEADER_PRESETS)[number];

export const LOGO_SIZES = ["small", "medium", "large"] as const;
export type LogoSize = (typeof LOGO_SIZES)[number];

export const BRAND_ALIGNMENTS = ["left", "center"] as const;
export type BrandAlignment = (typeof BRAND_ALIGNMENTS)[number];

export type HeaderBrandSettings = {
  showPhone: boolean;
  logoSize: LogoSize;
  align: BrandAlignment;
  /** Sulphur Springs only: icon vs text balance, 60–100. */
  iconScale?: number;
};

/** Current structured layout written by the new editor. */
export type HeaderBrandingLayoutV2 = {
  version: 2;
  preset: HeaderPreset;
  brands: Record<HeaderBrandKey, HeaderBrandSettings>;
};

/** Either schema, returned by the parser; v2 is preferred. */
export type HeaderBrandingLayout = HeaderBrandingLayoutV2 | HeaderBrandingLayoutV1;

export const HEADER_BRANDING_LAYOUT_DEFAULT: HeaderBrandingLayoutV2 = {
  version: 2,
  preset: "standard",
  brands: {
    chiro: { showPhone: true, logoSize: "medium", align: "left" },
    ss: { showPhone: true, logoSize: "medium", align: "left", iconScale: 88 },
  },
};

/** Pixel height of the header frame for each preset. */
export const HEADER_PRESET_HEIGHT_PX: Record<HeaderPreset, number> = {
  compact: 64,
  standard: 110,
  tall: 150,
};

/** Logo pixel height per brand by chosen size. */
export const LOGO_HEIGHT_PX: Record<HeaderBrandKey, Record<LogoSize, number>> = {
  chiro: { small: 34, medium: 52, large: 68 },
  ss: { small: 36, medium: 54, large: 70 },
};

const ICON_SCALE_MIN = 60;
const ICON_SCALE_MAX = 100;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function isHeaderPreset(v: unknown): v is HeaderPreset {
  return typeof v === "string" && (HEADER_PRESETS as readonly string[]).includes(v);
}

function isLogoSize(v: unknown): v is LogoSize {
  return typeof v === "string" && (LOGO_SIZES as readonly string[]).includes(v);
}

function isBrandAlignment(v: unknown): v is BrandAlignment {
  return typeof v === "string" && (BRAND_ALIGNMENTS as readonly string[]).includes(v);
}

function normalizeBrandSettings(
  key: HeaderBrandKey,
  raw: Partial<HeaderBrandSettings> | undefined,
): HeaderBrandSettings {
  const fallback = HEADER_BRANDING_LAYOUT_DEFAULT.brands[key];
  const settings: HeaderBrandSettings = {
    showPhone: typeof raw?.showPhone === "boolean" ? raw.showPhone : fallback.showPhone,
    logoSize: isLogoSize(raw?.logoSize) ? raw.logoSize : fallback.logoSize,
    align: isBrandAlignment(raw?.align) ? raw.align : fallback.align,
  };
  if (key === "ss") {
    const scale = typeof raw?.iconScale === "number" ? raw.iconScale : (fallback.iconScale ?? 88);
    settings.iconScale = clamp(scale, ICON_SCALE_MIN, ICON_SCALE_MAX);
  }
  return settings;
}

export function normalizeHeaderBrandingLayoutV2(
  raw: Partial<HeaderBrandingLayoutV2>,
): HeaderBrandingLayoutV2 {
  const preset = isHeaderPreset(raw.preset) ? raw.preset : HEADER_BRANDING_LAYOUT_DEFAULT.preset;
  const brands = {} as Record<HeaderBrandKey, HeaderBrandSettings>;
  for (const key of HEADER_BRAND_KEYS) {
    brands[key] = normalizeBrandSettings(key, raw.brands?.[key]);
  }
  return { version: 2, preset, brands };
}

/** Returns the layer-based geometry for v1 fallback rendering. */
export function headerBrandLayerBoxes(
  layout: HeaderBrandingLayoutV1,
  key: HeaderBrandKey,
): { logo: HeaderBrandLayerBox; text: HeaderBrandLayerBox } {
  const base = layout.brands[key] ?? legacyDefaultBox(key);
  const split = splitBoxesFromBrand(base);
  const logoRaw = layout.logoBoxes?.[key];
  const textRaw = layout.textBoxes?.[key];
  return {
    logo: clampLayerBox(
      logoRaw ?? {
        ...split.logo,
        ...(base.iconScale !== undefined ? { iconScale: base.iconScale } : {}),
      },
      10,
    ),
    text: clampLayerBox(textRaw ?? split.text),
  };
}

function legacyDefaultBox(key: HeaderBrandKey): HeaderBrandBox {
  const defaults: Record<HeaderBrandKey, HeaderBrandBox> = {
    chiro: { x: 1, y: 2, w: 30, h: 52 },
    ss: { x: 67, y: 2, w: 31, h: 52, iconScale: 88 },
  };
  return defaults[key];
}

function clampBox(box: HeaderBrandBox): HeaderBrandBox {
  return {
    x: clamp(box.x, 0, 92),
    y: clamp(box.y, 0, 80),
    w: clamp(box.w, 8, 70),
    h: clamp(box.h, 20, 90),
    ...(box.iconScale !== undefined
      ? { iconScale: clamp(box.iconScale, ICON_SCALE_MIN, ICON_SCALE_MAX) }
      : {}),
  };
}

function clampLayerBox(box: HeaderBrandLayerBox, hMin = 6): HeaderBrandLayerBox {
  const w = clamp(box.w, 8, 70);
  const h = clamp(box.h, hMin, 90);
  return {
    x: clamp(box.x, 0, 100 - w),
    y: clamp(box.y, 0, 100 - h),
    w,
    h,
    ...(box.iconScale !== undefined
      ? { iconScale: clamp(box.iconScale, ICON_SCALE_MIN, ICON_SCALE_MAX) }
      : {}),
  };
}

function splitBoxesFromBrand(box: HeaderBrandBox): {
  logo: HeaderBrandLayerBox;
  text: HeaderBrandLayerBox;
} {
  const logoH = clamp(box.h * 0.72, 12, 90);
  const textH = clamp(box.h * 0.24, 6, 30);
  const textY = clamp(box.y + logoH + 1, 0, 100 - textH);
  return {
    logo: clampLayerBox(
      {
        x: box.x,
        y: box.y,
        w: box.w,
        h: logoH,
        ...(box.iconScale !== undefined ? { iconScale: box.iconScale } : {}),
      },
      10,
    ),
    text: clampLayerBox({ x: box.x, y: textY, w: box.w, h: textH }),
  };
}

/** Read raw CMS values and return the best layout we can construct. */
export function parseHeaderBrandingLayout(
  cms: Partial<Record<string, string>>,
): HeaderBrandingLayout {
  const raw = cms[HEADER_BRANDING_LAYOUT_FIELD]?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { version?: unknown } & Record<string, unknown>;
      if (parsed?.version === 2) {
        return normalizeHeaderBrandingLayoutV2(parsed as Partial<HeaderBrandingLayoutV2>);
      }
      if (parsed?.version === 1) {
        return normalizeHeaderBrandingLayoutV1(parsed as HeaderBrandingLayoutV1);
      }
    } catch {
      /* fall through */
    }
  }

  const hasLegacy = HEADER_BRANDING_LEGACY_FIELD_IDS.some((id) => cms[id]?.trim());
  if (hasLegacy) {
    return layoutFromLegacyHeights(cms);
  }

  return HEADER_BRANDING_LAYOUT_DEFAULT;
}

export function normalizeHeaderBrandingLayoutV1(
  raw: HeaderBrandingLayoutV1,
): HeaderBrandingLayoutV1 {
  const frameHeight = clamp(raw.frameHeight, 56, 220);
  const brands = {} as Record<HeaderBrandKey, HeaderBrandBox>;
  const logoBoxes = {} as Record<HeaderBrandKey, HeaderBrandLayerBox>;
  const textBoxes = {} as Record<HeaderBrandKey, HeaderBrandLayerBox>;
  for (const key of HEADER_BRAND_KEYS) {
    const b = raw.brands?.[key] ?? legacyDefaultBox(key);
    brands[key] = clampBox(b);
    const split = splitBoxesFromBrand(brands[key]);
    logoBoxes[key] = clampLayerBox(
      raw.logoBoxes?.[key] ?? {
        ...split.logo,
        ...(brands[key].iconScale !== undefined ? { iconScale: brands[key].iconScale } : {}),
      },
      10,
    );
    textBoxes[key] = clampLayerBox(raw.textBoxes?.[key] ?? split.text);
  }
  return { version: 1, frameHeight, brands, logoBoxes, textBoxes };
}

function layoutFromLegacyHeights(
  cms: Partial<Record<string, string>>,
): HeaderBrandingLayoutV1 {
  const parseH = (id: string, fallback: number) => {
    const n = parseInt(String(cms[id] ?? "").trim(), 10);
    return Number.isFinite(n) ? clamp(n, 20, 120) : fallback;
  };
  const frameHeight = 132;
  const hToPct = (px: number) => clamp((px / frameHeight) * 100 * 0.55, 20, 90);

  const chiroH = hToPct(parseH("chiro_logo_height_side", 36));
  const ssH = hToPct(parseH("ss_logo_height_side", 36));
  const iconScale = clamp(parseH("ss_logo_icon_scale", 88), ICON_SCALE_MIN, ICON_SCALE_MAX);

  return normalizeHeaderBrandingLayoutV1({
    version: 1,
    frameHeight,
    brands: {
      chiro: { x: 1, y: 2, w: 30, h: chiroH },
      ss: { x: 67, y: 2, w: 31, h: ssH, iconScale },
    },
  });
}

export function serializeHeaderBrandingLayout(layout: HeaderBrandingLayout): string {
  if (layout.version === 2) {
    return JSON.stringify(normalizeHeaderBrandingLayoutV2(layout));
  }
  return JSON.stringify(normalizeHeaderBrandingLayoutV1(layout));
}

export const HEADER_BRANDING_FIELD_IDS = [
  HEADER_BRANDING_LAYOUT_FIELD,
  ...HEADER_BRANDING_LEGACY_FIELD_IDS,
] as const;

export function buildHeaderBrandingCmsRegistry(): ContentFieldMeta[] {
  return [
    {
      id: HEADER_BRANDING_LAYOUT_FIELD,
      pageLabel: "Header branding",
      sectionLabel: "Layout",
      fieldLabel: "Header preset (JSON)",
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
    chiro_logo_height_side: "36",
    chiro_logo_height_center: "64",
    ss_logo_height_side: "36",
    ss_logo_height_center: "64",
    ss_logo_icon_scale: "88",
  };
}

export const BRAND_LABELS: Record<HeaderBrandKey, string> = {
  chiro: "Chiropractic — Paris",
  ss: "Sulphur Springs",
};

/** @deprecated only used by removed visual editor; kept for backwards-compat imports. */
export function mergeBrandFromLayerBoxes(
  logo: HeaderBrandLayerBox,
  text: HeaderBrandLayerBox,
  fallback?: HeaderBrandBox,
): HeaderBrandBox {
  const left = Math.min(logo.x, text.x);
  const top = Math.min(logo.y, text.y);
  const right = Math.max(logo.x + logo.w, text.x + text.w);
  const bottom = Math.max(logo.y + logo.h, text.y + text.h);
  return clampBox({
    x: left,
    y: top,
    w: right - left,
    h: bottom - top,
    iconScale: logo.iconScale ?? fallback?.iconScale,
  });
}

/** @deprecated kept for legacy visual editor imports. */
export const normalizeHeaderBrandingLayout = normalizeHeaderBrandingLayoutV1;
