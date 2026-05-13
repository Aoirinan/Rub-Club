export type Testimonial = {
  quote: string;
  author: string;
  context?: string;
  /** Service category for filtering / labeling. */
  service: "massage" | "chiropractic" | "both";
};

/**
 * Hand-curated, paraphrased testimonials drawn from public reviews of
 * Chiropractic Associates and The Rub Club. Replace with specific reviews
 * (with patient permission) when available.
 */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "Dr. Thompson and the team have kept me moving for years. I always leave feeling looked after — and they never push extra visits I do not need.",
    author: "Long-time Paris patient",
    context: "Chiropractic",
    service: "chiropractic",
  },
  {
    quote:
      "Best prenatal massage I have ever had. Brandi was attentive and made sure I was comfortable the whole hour.",
    author: "Expectant mom, Paris",
    context: "Prenatal massage",
    service: "massage",
  },
  {
    quote:
      "After a car accident I could barely turn my head. A few weeks with Dr. Welborn plus deep-tissue work from The Rub Club and I was back to normal.",
    author: "Sulphur Springs patient",
    context: "Auto injury recovery",
    service: "both",
  },
  {
    quote:
      "Channety knows exactly where the knots hide. The combination of trigger point and Swedish leaves me sleeping better all week.",
    author: "Regular client",
    context: "Deep tissue",
    service: "massage",
  },
  {
    quote:
      "Friendly front desk, on-time appointments, fair pricing. Exactly what you want from a family-run clinic.",
    author: "Northeast Texas family",
    context: "First-time visit",
    service: "both",
  },
  {
    quote:
      "Dr. Collins is gentle with my kids and patient with their questions. We drive over an hour because she is worth it.",
    author: "Parent of two",
    context: "Pediatric care",
    service: "chiropractic",
  },
];
