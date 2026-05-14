/**
 * Chiropractic wellness membership pricing (Chiro-Fitness / Acu-Fit).
 * Source: practice wellness offerings; keep in sync with office materials.
 */

export type WellnessPlanSection = {
  id: string;
  title: string;
  subtitle?: string;
  lines: readonly string[];
};

export const WELLNESS_PAGE_LEDE =
  "Chiro-Fitness memberships use automatic monthly debit and are for wellness care only. Plans below are available through our Paris office — ask the front desk to enroll or to confirm current pricing.";

export const WELLNESS_SECTIONS: readonly WellnessPlanSection[] = [
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

export const WELLNESS_CLOSING_HEADLINE = "All the services you need, all in one place.";

export const WELLNESS_CLOSING_LINES = [
  "No startup or cancellation fees and no contracts.",
  "Get your wellness plan started today.",
  "Prices subject to change.",
] as const;
