/**
 * Sulphur Springs Chiro-Fitness / Acu-Fit wellness membership pricing.
 * Mirrors the Paris wellness plans (same pricing) but with its own CMS fields
 * (ss_wellness_*) and Sulphur Springs office/phone references. Defaults for
 * CMS; editable in superadmin -> Site content -> SS subpages.
 */

import type { ContentFieldMeta } from "@/lib/cms-registry";
import {
  WELLNESS_SECTION_SPECS,
  WELLNESS_HERO_EYEBROW,
  WELLNESS_CLOSING_HEADLINE,
  WELLNESS_CLOSING_LINES,
  parseWellnessLines,
  type WellnessPlanSection,
  type WellnessCarePlansContent,
} from "@/lib/wellness-care-plans-content";

export const SS_WELLNESS_PUBLIC_PATH = "/sulphur-springs/wellness-care-plans";

export const SS_WELLNESS_HERO_EYEBROW = WELLNESS_HERO_EYEBROW;

export const SS_WELLNESS_PAGE_LEDE =
  "Chiro-Fitness memberships use automatic monthly debit and are for wellness care only. The pricing below is the same for all Chiropractic Associates patients. Call our Sulphur Springs office at 903-919-5020 to enroll or confirm current pricing.";

export const SS_WELLNESS_CLOSING_HEADLINE = WELLNESS_CLOSING_HEADLINE;
export const SS_WELLNESS_CLOSING_LINES = WELLNESS_CLOSING_LINES;

export const SS_WELLNESS_CTA_TITLE = "Start your wellness plan";
export const SS_WELLNESS_CTA_BODY =
  "Call our Sulphur Springs office to set up monthly wellness care.";

export function ssWellnessSectionFieldId(
  sectionId: string,
  part: "title" | "subtitle" | "lines",
): string {
  return `ss_wellness_${sectionId}_${part}`;
}

function buildSSWellnessSectionsFromContent(c: Record<string, string>): WellnessPlanSection[] {
  return WELLNESS_SECTION_SPECS.map((spec) => {
    const titleKey = ssWellnessSectionFieldId(spec.id, "title");
    const subtitleKey = ssWellnessSectionFieldId(spec.id, "subtitle");
    const linesKey = ssWellnessSectionFieldId(spec.id, "lines");
    const subtitleRaw = (c[subtitleKey] ?? spec.subtitle ?? "").trim();
    return {
      id: spec.id,
      title: (c[titleKey] ?? spec.title).trim() || spec.title,
      subtitle: subtitleRaw || undefined,
      lines: parseWellnessLines(c[linesKey] ?? spec.lines.join("\n")),
    };
  });
}

export const SS_WELLNESS_PAGE_CMS_FIELD_IDS = [
  "ss_wellness_hero_eyebrow",
  "ss_wellness_page_lede",
  ...WELLNESS_SECTION_SPECS.flatMap((s) => [
    ssWellnessSectionFieldId(s.id, "title"),
    ssWellnessSectionFieldId(s.id, "subtitle"),
    ssWellnessSectionFieldId(s.id, "lines"),
  ]),
  "ss_wellness_closing_headline",
  "ss_wellness_closing_lines",
  "ss_wellness_cta_title",
  "ss_wellness_cta_body",
] as const;

export function ssWellnessCarePlansDefaults(): Record<string, string> {
  const out: Record<string, string> = {
    ss_wellness_hero_eyebrow: SS_WELLNESS_HERO_EYEBROW,
    ss_wellness_page_lede: SS_WELLNESS_PAGE_LEDE,
    ss_wellness_closing_headline: SS_WELLNESS_CLOSING_HEADLINE,
    ss_wellness_closing_lines: SS_WELLNESS_CLOSING_LINES.join("\n"),
    ss_wellness_cta_title: SS_WELLNESS_CTA_TITLE,
    ss_wellness_cta_body: SS_WELLNESS_CTA_BODY,
  };
  for (const spec of WELLNESS_SECTION_SPECS) {
    out[ssWellnessSectionFieldId(spec.id, "title")] = spec.title;
    out[ssWellnessSectionFieldId(spec.id, "subtitle")] = spec.subtitle ?? "";
    out[ssWellnessSectionFieldId(spec.id, "lines")] = spec.lines.join("\n");
  }
  return out;
}

export function buildSSWellnessCarePlansContent(
  c: Record<string, string>,
): WellnessCarePlansContent {
  const d = ssWellnessCarePlansDefaults();
  return {
    heroEyebrow: c.ss_wellness_hero_eyebrow ?? d.ss_wellness_hero_eyebrow!,
    pageLede: c.ss_wellness_page_lede ?? d.ss_wellness_page_lede!,
    sections: buildSSWellnessSectionsFromContent(c),
    closingHeadline: c.ss_wellness_closing_headline ?? d.ss_wellness_closing_headline!,
    closingLines: parseWellnessLines(c.ss_wellness_closing_lines ?? d.ss_wellness_closing_lines!),
    ctaTitle: c.ss_wellness_cta_title ?? d.ss_wellness_cta_title!,
    ctaBody: c.ss_wellness_cta_body ?? d.ss_wellness_cta_body!,
  };
}

/** CMS registry fields for the Sulphur Springs wellness care plans page. */
export function buildSSWellnessCmsRegistry(): ContentFieldMeta[] {
  const fields: ContentFieldMeta[] = [
    {
      id: "ss_wellness_hero_eyebrow",
      pageLabel: "SS subpages",
      sectionLabel: "Wellness care plans",
      fieldLabel: "Hero eyebrow",
      type: "text",
    },
    {
      id: "ss_wellness_page_lede",
      pageLabel: "SS subpages",
      sectionLabel: "Wellness care plans",
      fieldLabel: "Page lede",
      type: "richtext",
    },
  ];
  for (const spec of WELLNESS_SECTION_SPECS) {
    fields.push(
      {
        id: ssWellnessSectionFieldId(spec.id, "title"),
        pageLabel: "SS subpages",
        sectionLabel: "Wellness care plans",
        fieldLabel: `${spec.title} - title`,
        type: "text",
      },
      {
        id: ssWellnessSectionFieldId(spec.id, "subtitle"),
        pageLabel: "SS subpages",
        sectionLabel: "Wellness care plans",
        fieldLabel: `${spec.title} - subtitle (optional)`,
        type: "text",
      },
      {
        id: ssWellnessSectionFieldId(spec.id, "lines"),
        pageLabel: "SS subpages",
        sectionLabel: "Wellness care plans",
        fieldLabel: `${spec.title} - price lines (one per line)`,
        type: "richtext",
      },
    );
  }
  fields.push(
    {
      id: "ss_wellness_closing_headline",
      pageLabel: "SS subpages",
      sectionLabel: "Wellness care plans",
      fieldLabel: "Closing headline",
      type: "text",
    },
    {
      id: "ss_wellness_closing_lines",
      pageLabel: "SS subpages",
      sectionLabel: "Wellness care plans",
      fieldLabel: "Closing lines (one per line)",
      type: "richtext",
    },
    {
      id: "ss_wellness_cta_title",
      pageLabel: "SS subpages",
      sectionLabel: "Wellness care plans",
      fieldLabel: "CTA title",
      type: "text",
    },
    {
      id: "ss_wellness_cta_body",
      pageLabel: "SS subpages",
      sectionLabel: "Wellness care plans",
      fieldLabel: "CTA body",
      type: "text",
    },
  );
  return fields;
}
