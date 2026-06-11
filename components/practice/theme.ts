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
    accent: "#015949",
    accentHover: "#0b7a64",
    heading: "#013a30",
    eyebrow: "#f19f1f",
    heroOverlay: "#01302a",
    heroFrom: "#01302ae6",
    heroVia: "#01302a8c",
  },
  "paris-chiro": {
    accent: "#015949",
    accentHover: "#0b7a64",
    heading: "#013a30",
    eyebrow: "#7fd1c8",
    heroOverlay: "#10302d",
    heroFrom: "#10302de6",
    heroVia: "#10302d80",
  },
  "sulphur-springs": {
    accent: "#015949",
    accentHover: "#0b7a64",
    heading: "#013a30",
    eyebrow: "#f19f1f",
    heroOverlay: "#01302a",
    heroFrom: "#01302ad9",
    heroVia: "#01302a80",
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
