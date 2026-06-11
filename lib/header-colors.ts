import type { BrandLogoVariant } from "@/lib/brand-logos";
import type { SiteBusinessContext } from "@/lib/site-business-context";

export type HeaderBandColors = {
  phoneBarBg: string;
  logoRowBg: string;
  navBg: string;
  navHover: string;
};

export type HeaderColorConfig = {
  /** Home, massage, and Paris chiropractic pages. */
  paris: HeaderBandColors;
  sulphurSprings: HeaderBandColors;
};

export type PartialHeaderColorConfig = {
  paris?: Partial<HeaderBandColors>;
  sulphurSprings?: Partial<HeaderBandColors>;
};

export const DEFAULT_PARIS_HEADER_COLORS: HeaderBandColors = {
  phoneBarBg: "#01302a",
  logoRowBg: "#ffffff",
  navBg: "#eceae5",
  navHover: "#25455e",
};

export const DEFAULT_SULPHUR_HEADER_COLORS: HeaderBandColors = {
  phoneBarBg: "#01302a",
  logoRowBg: "#ffffff",
  navBg: "#eceae5",
  navHover: "#25455e",
};

export const DEFAULT_HEADER_COLORS: HeaderColorConfig = {
  paris: DEFAULT_PARIS_HEADER_COLORS,
  sulphurSprings: DEFAULT_SULPHUR_HEADER_COLORS,
};

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value.trim());
}

function normalizeHex(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed && isValidHexColor(trimmed)) return trimmed.toLowerCase();
  return fallback.toLowerCase();
}

function mergeBandColors(
  partial: Partial<HeaderBandColors> | undefined,
  defaults: HeaderBandColors,
): HeaderBandColors {
  return {
    phoneBarBg: normalizeHex(partial?.phoneBarBg, defaults.phoneBarBg),
    logoRowBg: normalizeHex(partial?.logoRowBg, defaults.logoRowBg),
    navBg: normalizeHex(partial?.navBg, defaults.navBg),
    navHover: normalizeHex(partial?.navHover, defaults.navHover),
  };
}

export function mergeHeaderColors(
  partial: PartialHeaderColorConfig | undefined,
): HeaderColorConfig {
  return {
    paris: mergeBandColors(partial?.paris, DEFAULT_PARIS_HEADER_COLORS),
    sulphurSprings: mergeBandColors(partial?.sulphurSprings, DEFAULT_SULPHUR_HEADER_COLORS),
  };
}

export function headerColorsForVariant(
  variant: BrandLogoVariant,
  config: HeaderColorConfig = DEFAULT_HEADER_COLORS,
): HeaderBandColors {
  if (variant === "sulphur-springs") return config.sulphurSprings;
  return config.paris;
}

export function headerColorsForBusinessContext(
  context: SiteBusinessContext,
  config: HeaderColorConfig = DEFAULT_HEADER_COLORS,
): HeaderBandColors {
  if (context === "sulphur_springs") return config.sulphurSprings;
  return config.paris;
}

export function headerBandColorsToCssVars(colors: HeaderBandColors): Record<string, string> {
  return {
    "--header-phone-bar-bg": colors.phoneBarBg,
    "--header-logo-row-bg": colors.logoRowBg,
    "--header-nav-bg": colors.navBg,
    "--header-nav-hover": colors.navHover,
  };
}

export function validateHeaderColorConfig(
  config: HeaderColorConfig,
): { ok: true } | { ok: false; error: string } {
  for (const [section, bands] of Object.entries(config) as [string, HeaderBandColors][]) {
    for (const [key, value] of Object.entries(bands) as [keyof HeaderBandColors, string][]) {
      if (!isValidHexColor(value)) {
        return { ok: false, error: `Invalid hex color for ${section}.${key}: ${value}` };
      }
    }
  }
  return { ok: true };
}
