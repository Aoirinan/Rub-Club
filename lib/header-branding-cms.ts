import type { ContentFieldMeta } from "@/lib/cms-registry";

export const HEADER_BRANDING_FIELD_IDS = [
  "rub_logo_height_side",
  "rub_logo_height_center",
  "chiro_logo_height_side",
  "chiro_logo_height_center",
  "ss_logo_height_side",
  "ss_logo_height_center",
  "ss_logo_icon_scale",
] as const;

export type HeaderBrandingFieldId = (typeof HEADER_BRANDING_FIELD_IDS)[number];

/** Default px heights aligned with prior Tailwind sizes. */
export const HEADER_BRANDING_DEFAULTS: Record<HeaderBrandingFieldId, string> = {
  rub_logo_height_side: "36",
  rub_logo_height_center: "64",
  chiro_logo_height_side: "36",
  chiro_logo_height_center: "64",
  ss_logo_height_side: "36",
  ss_logo_height_center: "64",
  ss_logo_icon_scale: "88",
};

const PX_MIN = 20;
const PX_MAX = 120;
const SCALE_MIN = 60;
const SCALE_MAX = 100;

function clampPx(raw: string | undefined, fallback: number): number {
  const n = parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(PX_MAX, Math.max(PX_MIN, n));
}

function clampScale(raw: string | undefined, fallback: number): number {
  const n = parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, n));
}

export type HeaderBrandingHeights = {
  rub: { side: number; center: number };
  chiro: { side: number; center: number };
  ss: { side: number; center: number; iconScalePercent: number };
};

export function parseHeaderBrandingHeights(
  cms: Partial<Record<string, string>>,
): HeaderBrandingHeights {
  const d = HEADER_BRANDING_DEFAULTS;
  return {
    rub: {
      side: clampPx(cms.rub_logo_height_side, parseInt(d.rub_logo_height_side, 10)),
      center: clampPx(cms.rub_logo_height_center, parseInt(d.rub_logo_height_center, 10)),
    },
    chiro: {
      side: clampPx(cms.chiro_logo_height_side, parseInt(d.chiro_logo_height_side, 10)),
      center: clampPx(cms.chiro_logo_height_center, parseInt(d.chiro_logo_height_center, 10)),
    },
    ss: {
      side: clampPx(cms.ss_logo_height_side, parseInt(d.ss_logo_height_side, 10)),
      center: clampPx(cms.ss_logo_height_center, parseInt(d.ss_logo_height_center, 10)),
      iconScalePercent: clampScale(cms.ss_logo_icon_scale, parseInt(d.ss_logo_icon_scale, 10)),
    },
  };
}

export function buildHeaderBrandingCmsRegistry(): ContentFieldMeta[] {
  return [
    {
      id: "rub_logo_height_side",
      pageLabel: "Header branding",
      sectionLabel: "Rub Club",
      fieldLabel: "Left/right size (pixels)",
      type: "text",
    },
    {
      id: "rub_logo_height_center",
      pageLabel: "Header branding",
      sectionLabel: "Rub Club",
      fieldLabel: "Center size when highlighted (pixels)",
      type: "text",
    },
    {
      id: "chiro_logo_height_side",
      pageLabel: "Header branding",
      sectionLabel: "Chiropractic",
      fieldLabel: "Left/right size (pixels)",
      type: "text",
    },
    {
      id: "chiro_logo_height_center",
      pageLabel: "Header branding",
      sectionLabel: "Chiropractic",
      fieldLabel: "Center size when highlighted (pixels)",
      type: "text",
    },
    {
      id: "ss_logo_height_side",
      pageLabel: "Header branding",
      sectionLabel: "Sulphur Springs",
      fieldLabel: "Left/right size (pixels)",
      type: "text",
    },
    {
      id: "ss_logo_height_center",
      pageLabel: "Header branding",
      sectionLabel: "Sulphur Springs",
      fieldLabel: "Center size when highlighted (pixels)",
      type: "text",
    },
    {
      id: "ss_logo_icon_scale",
      pageLabel: "Header branding",
      sectionLabel: "Sulphur Springs",
      fieldLabel: "Icon size vs text (percent)",
      type: "text",
    },
  ];
}

export function buildHeaderBrandingCmsDefaults(): Record<string, string> {
  return { ...HEADER_BRANDING_DEFAULTS };
}
