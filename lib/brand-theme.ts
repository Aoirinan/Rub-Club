import { cache } from "react";
import type { CSSProperties } from "react";
import { getFirestore } from "@/lib/firebase-admin";
import { PRACTICE_THEMES } from "@/components/practice/theme";
import {
  PRACTICE_PAGES_COLLECTION,
  type PracticeLocationId,
  type PracticeThemeColors,
} from "@/lib/practice-pages-shared";

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
async function readStoredTheme(loc: PracticeLocationId): Promise<Partial<PracticeThemeColors>> {
  // Only the `theme` map is needed here: read the practice doc directly instead
  // of building the full page (dozens of CMS reads) on every request.
  const snap = await getFirestore().collection(PRACTICE_PAGES_COLLECTION).doc(loc).get();
  const raw = snap.exists ? snap.get("theme") : null;
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<PracticeThemeColors> = {};
  for (const key of ["heading", "accent", "accentHover", "ctaBg", "ctaHover"] as const) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "string") out[key] = v;
  }
  return out;
}

export const getBrandThemeStyle = cache(async function getBrandThemeStyle(): Promise<CSSProperties> {
  let paris: Partial<PracticeThemeColors> = {};
  let ss: Partial<PracticeThemeColors> = {};
  try {
    [paris, ss] = await Promise.all([
      readStoredTheme("paris-home"),
      readStoredTheme("sulphur-springs"),
    ]);
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
});
