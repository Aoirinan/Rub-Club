/**
 * Chiropractic wellness membership pricing (Chiro-Fitness / Acu-Fit).
 * Defaults for CMS; editable in superadmin → Site content → Wellness care plans.
 */

import { WELLNESS_CARE_PLANS_PATH } from "@/lib/constants";

export type WellnessPlanSection = {
  id: string;
  title: string;
  subtitle?: string;
  lines: readonly string[];
};

export const WELLNESS_PUBLIC_PATH = WELLNESS_CARE_PLANS_PATH;

export const WELLNESS_HERO_EYEBROW = "Chiro-Fitness · Acu-Fit";

export const WELLNESS_PAGE_LEDE =
  "Chiro-Fitness memberships use automatic monthly debit and are for wellness care only. The pricing below is the same for all Chiropractic Associates patients; enrollment is handled at our Paris office (3305 NE Loop 286). Sulphur Springs patients may use these plans when seen in Paris — call 903-785-5551 to enroll or confirm current pricing.";

export const WELLNESS_SECTION_SPECS: readonly WellnessPlanSection[] = [
  {
    id: "adjustment",
    title: "Chiropractic treatments",
    subtitle: "Adjustment only",
    lines: [
      "1 adjustment and roller table per month — $40.00",
      "2 adjustments and roller table per month — $70.00 (savings of over $20.00)",
      "4 adjustments and roller table per month — $140.00 (savings of over $45.00)",
    ],
  },
  {
    id: "therapy",
    title: "Therapy & adjustment",
    lines: [
      "1 EMS session and 1 adjustment per month — $60.00",
      "2 therapy visits and 2 adjustments per month — $100.00 (savings of $30.00)",
      "4 therapy and adjustment visits per month — $200.00 (savings of $60.00)",
    ],
  },
  {
    id: "massage",
    title: "Massage & adjustment",
    lines: [
      "1 thirty-minute massage and 1 adjustment per month — $72.00",
      "1 sixty-minute massage and 1 adjustment per month — $99.00",
      "2 thirty-minute massages and 2 adjustments per month — $129.00",
      "2 sixty-minute massages and 2 adjustments per month — $188.00",
      "4 sixty-minute massages and 4 adjustments per month — $360.00",
    ],
  },
  {
    id: "acu",
    title: "Acu-Fit acupuncture",
    lines: [
      "1 session per month — $40.00",
      "2 sessions per month — $80.00",
      "4 sessions per month — $160.00",
    ],
  },
  {
    id: "rehab",
    title: "Rehab sessions only",
    lines: [
      "1 thirty-minute rehab session per month — $25.00",
      "1 forty-five-minute rehab session per month — $37.50",
      "1 sixty-minute rehab session per month — $50.00",
    ],
  },
] as const;

/** @deprecated Use WELLNESS_SECTION_SPECS */
export const WELLNESS_SECTIONS = WELLNESS_SECTION_SPECS;

export const WELLNESS_CLOSING_HEADLINE = "All the services you need, all in one place.";

export const WELLNESS_CLOSING_LINES = [
  "No startup or cancellation fees and no contracts.",
  "Get your wellness plan started today.",
  "Prices subject to change.",
] as const;

export const WELLNESS_CTA_TITLE = "Start your wellness plan";
export const WELLNESS_CTA_BODY =
  "Book online or call our Paris office to set up monthly wellness care.";

export const CHIRO_WELLNESS_TEASER_HEADING = "Wellness care plans";
export const CHIRO_WELLNESS_TEASER_BODY =
  "Monthly Chiro-Fitness and Acu-Fit memberships use the same Paris pricing for all Chiropractic Associates patients. Plans combine adjustments, roller table, massage, therapy, acupuncture, and rehab options — enrollment at our Paris office on NE Loop 286.";

export function wellnessSectionFieldId(sectionId: string, part: "title" | "subtitle" | "lines"): string {
  return `wellness_${sectionId}_${part}`;
}

export function parseWellnessLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildWellnessSectionsFromContent(c: Record<string, string>): WellnessPlanSection[] {
  return WELLNESS_SECTION_SPECS.map((spec) => {
    const titleKey = wellnessSectionFieldId(spec.id, "title");
    const subtitleKey = wellnessSectionFieldId(spec.id, "subtitle");
    const linesKey = wellnessSectionFieldId(spec.id, "lines");
    const subtitleRaw = (c[subtitleKey] ?? spec.subtitle ?? "").trim();
    return {
      id: spec.id,
      title: (c[titleKey] ?? spec.title).trim() || spec.title,
      subtitle: subtitleRaw || undefined,
      lines: parseWellnessLines(c[linesKey] ?? spec.lines.join("\n")),
    };
  });
}

export const WELLNESS_PAGE_CMS_FIELD_IDS = [
  "wellness_hero_eyebrow",
  "wellness_page_lede",
  ...WELLNESS_SECTION_SPECS.flatMap((s) => [
    wellnessSectionFieldId(s.id, "title"),
    wellnessSectionFieldId(s.id, "subtitle"),
    wellnessSectionFieldId(s.id, "lines"),
  ]),
  "wellness_closing_headline",
  "wellness_closing_lines",
  "wellness_cta_title",
  "wellness_cta_body",
] as const;

export function wellnessCarePlansDefaults(): Record<string, string> {
  const out: Record<string, string> = {
    wellness_hero_eyebrow: WELLNESS_HERO_EYEBROW,
    wellness_page_lede: WELLNESS_PAGE_LEDE,
    wellness_closing_headline: WELLNESS_CLOSING_HEADLINE,
    wellness_closing_lines: WELLNESS_CLOSING_LINES.join("\n"),
    wellness_cta_title: WELLNESS_CTA_TITLE,
    wellness_cta_body: WELLNESS_CTA_BODY,
    chiro_wellness_teaser_heading: CHIRO_WELLNESS_TEASER_HEADING,
    chiro_wellness_teaser_body: CHIRO_WELLNESS_TEASER_BODY,
  };
  for (const spec of WELLNESS_SECTION_SPECS) {
    out[wellnessSectionFieldId(spec.id, "title")] = spec.title;
    out[wellnessSectionFieldId(spec.id, "subtitle")] = spec.subtitle ?? "";
    out[wellnessSectionFieldId(spec.id, "lines")] = spec.lines.join("\n");
  }
  return out;
}

export type WellnessCarePlansContent = {
  heroEyebrow: string;
  pageLede: string;
  sections: WellnessPlanSection[];
  closingHeadline: string;
  closingLines: string[];
  ctaTitle: string;
  ctaBody: string;
};

export function buildWellnessCarePlansContent(c: Record<string, string>): WellnessCarePlansContent {
  const d = wellnessCarePlansDefaults();
  return {
    heroEyebrow: c.wellness_hero_eyebrow ?? d.wellness_hero_eyebrow!,
    pageLede: c.wellness_page_lede ?? d.wellness_page_lede!,
    sections: buildWellnessSectionsFromContent(c),
    closingHeadline: c.wellness_closing_headline ?? d.wellness_closing_headline!,
    closingLines: parseWellnessLines(c.wellness_closing_lines ?? d.wellness_closing_lines!),
    ctaTitle: c.wellness_cta_title ?? d.wellness_cta_title!,
    ctaBody: c.wellness_cta_body ?? d.wellness_cta_body!,
  };
}
