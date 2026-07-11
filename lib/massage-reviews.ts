/**
 * Massage / Rub Club reviews (CURSOR_PROMPT §6b, §8c).
 *
 * Sourced from the existing reviews collection, filtered to massage. Phase 4
 * (§8) extends location tagging on practice testimonials; this helper is the
 * single seam the massage page reads so that source can evolve without touching
 * the page. Ratings default to 5 stars for these curated stories.
 */
import { TESTIMONIALS } from "@/lib/testimonials";

export type MassageReview = {
  name: string;
  quote: string;
  context?: string;
  /** 1-5 filled stars. */
  rating: number;
  /** Optional ISO date; omitted when the source has none. */
  date?: string;
};

/** Massage-scoped reviews for the massage page. */
export function getMassageReviews(): MassageReview[] {
  return TESTIMONIALS.filter((t) => t.service === "massage" || t.service === "both").map((t) => ({
    name: t.author,
    quote: t.quote,
    context: t.context,
    rating: 5,
  }));
}
