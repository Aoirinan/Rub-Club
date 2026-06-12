import type { CSSProperties } from "react";
import { getPracticePage } from "@/lib/practice-pages";
import { PRACTICE_THEMES } from "@/components/practice/theme";
import type { PracticeThemeColors } from "@/lib/practice-pages-shared";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function pick(override: string | undefined, fallback: string): string {
  const v = override?.trim() ?? "";
  return HEX_RE.test(v) ? v.toLowerCase() : fallback;
}

/**
 * Site-wide brand color CSS variables, driven by the manager-edited
 * "Theme colors" on the practice pages (paris-home / sulphur-springs).
 * Applied on <body> so generic subpages (PageHero bands, Book Now buttons,
 * contact forms, CTA cards) follow the same editable palette.
 */
export async function getBrandThemeStyle(): Promise<CSSProperties> {
  let paris: Partial<PracticeThemeColors> = {};
  let ss: Partial<PracticeThemeColors> = {};
  try {
    const [p, s] = await Promise.all([
      getPracticePage("paris-home"),
      getPracticePage("sulphur-springs"),
    ]);
    paris = p.theme ?? {};
    ss = s.theme ?? {};
  } catch {
    // Firestore unavailable: fall back to the default palettes.
  }
  const pd = PRACTICE_THEMES["paris-home"];
  const sd = PRACTICE_THEMES["sulphur-springs"];
  return {
    "--brand-paris-heading": pick(paris.heading, pd.heading),
    "--brand-paris-accent": pick(paris.accent, pd.accent),
    "--brand-paris-accent-hover": pick(paris.accentHover, pd.accentHover),
    "--brand-paris-cta": pick(paris.ctaBg, pd.ctaBg),
    "--brand-paris-cta-hover": pick(paris.ctaHover, pd.ctaHover),
    "--brand-ss-heading": pick(ss.heading, sd.heading),
    "--brand-ss-accent": pick(ss.accent, sd.accent),
    "--brand-ss-accent-hover": pick(ss.accentHover, sd.accentHover),
    "--brand-ss-cta": pick(ss.ctaBg, sd.ctaBg),
    "--brand-ss-cta-hover": pick(ss.ctaHover, sd.ctaHover),
  } as CSSProperties;
}
