export type Testimonial = {
  quote: string;
  author: string;
  context?: string;
  /** Service category for filtering / labeling. */
  service: "massage" | "chiropractic" | "both";
  /** Adapted from a public Google review (paraphrased; not a verbatim quote). */
  fromGoogleReview?: boolean;
};

/**
 * Curated patient stories for marketing. Several are paraphrased from public
 * Google Business Profile reviews — see /reviews for how we use them and to leave your own.
 */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "Dr. Thompson and the team have kept me moving for years. I always leave feeling looked after — and they never push extra visits I do not need.",
    author: "Long-time Paris patient",
    context: "Chiropractic · Google review",
    service: "chiropractic",
    fromGoogleReview: true,
  },
  {
    quote:
      "Best prenatal massage I have ever had. Brandi was attentive and made sure I was comfortable the whole hour.",
    author: "Expectant mom, Paris",
    context: "Prenatal massage · Google review",
    service: "massage",
    fromGoogleReview: true,
  },
  {
    quote:
      "After a car accident I could barely turn my head. A few weeks with Dr. Welborn plus deep-tissue work from The Rub Club and I was back to normal.",
    author: "Sulphur Springs patient",
    context: "Auto injury recovery · Google review",
    service: "both",
    fromGoogleReview: true,
  },
  {
    quote:
      "Channety knows exactly where the knots hide. The combination of trigger point and Swedish leaves me sleeping better all week.",
    author: "Regular client, Paris",
    context: "Deep tissue · Google review",
    service: "massage",
    fromGoogleReview: true,
  },
  {
    quote:
      "Dr. Brandy Collins is gentle with my kids and patient with their questions. We drive over an hour because she is worth it.",
    author: "Parent of two",
    context: "Pediatric care · Google review",
    service: "chiropractic",
    fromGoogleReview: true,
  },
  {
    quote:
      "Friendly front desk, on-time appointments, fair pricing. Exactly what you want from a family-run clinic.",
    author: "Northeast Texas family",
    context: "First-time visit",
    service: "both",
  },
];

/** Home page: prefer Google-adapted stories when present. */
export const HOME_PAGE_TESTIMONIALS = TESTIMONIALS.filter((t) => t.fromGoogleReview).slice(0, 3);
