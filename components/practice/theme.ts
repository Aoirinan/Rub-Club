import type { CSSProperties } from "react";
import type { PracticeLocationId } from "@/lib/practice-pages-shared";

/**
 * Per-location accent palette for the shared practice sections, exposed as CSS
 * variables so one set of Tailwind arbitrary-value classes
 * (e.g. `bg-[var(--pp-accent)]`) themes both pages.
 */
export type PracticeThemeVars = {
  /** Primary accent (borders, buttons, links). */
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
};

export const PRACTICE_THEMES: Record<PracticeLocationId, PracticeThemeVars> = {
  // Home shares the Paris teal palette.
  "paris-home": {
    accent: "#0f5f5c",
    accentHover: "#0f817b",
    heading: "#173f3b",
    eyebrow: "#f2d25d",
    heroOverlay: "#0c3937",
    heroFrom: "#0c3937e6",
    heroVia: "#0c39378c",
  },
  "paris-chiro": {
    accent: "#0f5f5c",
    accentHover: "#0f817b",
    heading: "#173f3b",
    eyebrow: "#7fd1c8",
    heroOverlay: "#10302d",
    heroFrom: "#10302de6",
    heroVia: "#10302d80",
  },
  "sulphur-springs": {
    accent: "#2980b9",
    accentHover: "#1a6da3",
    heading: "#173f3b",
    eyebrow: "#5dade2",
    heroOverlay: "#0c2d3a",
    heroFrom: "#0c2d3ad9",
    heroVia: "#0c2d3a80",
  },
};

export function practiceThemeStyle(loc: PracticeLocationId): CSSProperties {
  const t = PRACTICE_THEMES[loc];
  return {
    "--pp-accent": t.accent,
    "--pp-accent-hover": t.accentHover,
    "--pp-heading": t.heading,
    "--pp-eyebrow": t.eyebrow,
    "--pp-hero-overlay": t.heroOverlay,
    "--pp-hero-from": t.heroFrom,
    "--pp-hero-via": t.heroVia,
  } as CSSProperties;
}
