import type { CSSProperties } from "react";
import type {
  PracticeLocationId,
  PracticeThemeColors,
} from "@/lib/practice-pages-shared";

/**
 * Per-location accent palette for the shared practice sections, exposed as CSS
 * variables so one set of Tailwind arbitrary-value classes
 * (e.g. `bg-[var(--pp-accent)]`) themes both pages.
 */
export type PracticeThemeVars = {
  /** Primary accent (section headings, circles, quote marks, links). */
  accent: string;
  /** Accent hover state. */
  accentHover: string;
  /** Dark heading color. */
  heading: string;
  /** Eyebrow / kicker text over dark hero imagery. */
  eyebrow: string;
  /** Dark hero overlay base color. */
  heroOverlay: string;
  /** Hero gradient stops (8-digit hex; Tailwind can't add alpha to var colors). */
  heroFrom: string;
  heroVia: string;
  /** Angled hero panel gradient stops (8-digit hex). */
  heroPanelFrom: string;
  heroPanelVia: string;
  /** CTA button rectangles. */
  ctaBg: string;
  ctaHover: string;
};

export const PRACTICE_THEMES: Record<PracticeLocationId, PracticeThemeVars> = {
  // Paris locations share the red palette. The hero base/panel use a cleaner,
  // brighter brick red (mirroring the Sulphur Springs blue) so the hero reads
  // as vivid red instead of muddy maroon; body headings/buttons keep the deep
  // brand red (#4a1515) for contrast and readability.
  "paris-home": {
    accent: "#c0392b",
    accentHover: "#962d22",
    heading: "#4a1515",
    eyebrow: "#f3c1ba",
    heroOverlay: "#6e1a1a",
    heroFrom: "#6e1a1ad9",
    heroVia: "#6e1a1a80",
    heroPanelFrom: "#b5301fe6",
    heroPanelVia: "#b5301fcc",
    ctaBg: "#4a1515",
    ctaHover: "#341010",
  },
  "paris-chiro": {
    accent: "#c0392b",
    accentHover: "#962d22",
    heading: "#4a1515",
    eyebrow: "#f3c1ba",
    heroOverlay: "#6e1a1a",
    heroFrom: "#6e1a1ad9",
    heroVia: "#6e1a1a80",
    heroPanelFrom: "#b5301fe6",
    heroPanelVia: "#b5301fcc",
    ctaBg: "#4a1515",
    ctaHover: "#341010",
  },
  "sulphur-springs": {
    accent: "#2980b9",
    accentHover: "#1a6da3",
    heading: "#0c2d3a",
    eyebrow: "#a8d4ee",
    heroOverlay: "#0c2d3a",
    heroFrom: "#0c2d3ad9",
    heroVia: "#0c2d3a80",
    heroPanelFrom: "#1f618de6",
    heroPanelVia: "#1f618dcc",
    ctaBg: "#0c2d3a",
    ctaHover: "#081f29",
  },
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function pick(override: string | undefined, fallback: string): string {
  const v = override?.trim() ?? "";
  return HEX_RE.test(v) ? v.toLowerCase() : fallback;
}

/**
 * CSS variables for a location's practice theme. Pass the page doc's `theme`
 * to let CMS-edited colors override the defaults.
 */
export function practiceThemeStyle(
  loc: PracticeLocationId,
  override?: Partial<PracticeThemeColors>,
): CSSProperties {
  const t = PRACTICE_THEMES[loc];
  return {
    "--pp-accent": pick(override?.accent, t.accent),
    "--pp-accent-hover": pick(override?.accentHover, t.accentHover),
    "--pp-heading": pick(override?.heading, t.heading),
    "--pp-eyebrow": t.eyebrow,
    "--pp-hero-overlay": t.heroOverlay,
    "--pp-hero-from": t.heroFrom,
    "--pp-hero-via": t.heroVia,
    "--pp-hero-panel-from": pick(override?.heroPanelFrom, t.heroPanelFrom),
    "--pp-hero-panel-via": pick(override?.heroPanelVia, t.heroPanelVia),
    "--pp-cta": pick(override?.ctaBg, t.ctaBg),
    "--pp-cta-hover": pick(override?.ctaHover, t.ctaHover),
  } as CSSProperties;
}
