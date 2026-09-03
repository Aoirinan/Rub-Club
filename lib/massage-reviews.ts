/**
 * Massage / Rub Club reviews (CURSOR_PROMPT §6b, §8c).
 *
 * Sourced from the existing reviews collection, filtered to massage, with the
 * same per-slot `reviews_testimonial_N_*` CMS overrides that /reviews applies,
 * so editing a story under Reviews changes it here too. Ratings default to
 * 5 stars for these curated stories.
 */
import { getContentMany } from "@/lib/cms";
import { REVIEWS_TESTIMONIAL_SLOTS } from "@/lib/static-pages-cms";

export type MassageReview = {
  name: string;
  quote: string;
  context?: string;
  /** 1-5 filled stars. */
  rating: number;
  /** Optional ISO date; omitted when the source has none. */
  date?: string;
};

const MASSAGE_SLOTS = REVIEWS_TESTIMONIAL_SLOTS.filter(
  ({ testimonial: t }) => t.service === "massage" || t.service === "both",
);

/** Massage-scoped reviews for the massage page, with Reviews-page CMS overrides applied. */
export async function getMassageReviews(): Promise<MassageReview[]> {
  const ids = MASSAGE_SLOTS.flatMap(({ n }) => [
    `reviews_testimonial_${n}_quote`,
    `reviews_testimonial_${n}_author`,
    `reviews_testimonial_${n}_context`,
  ]);
  const cms = await getContentMany(ids);
  return MASSAGE_SLOTS.map(({ n, testimonial: t }) => ({
    name: cms[`reviews_testimonial_${n}_author`]?.trim() || t.author,
    quote: cms[`reviews_testimonial_${n}_quote`]?.trim() || t.quote,
    context: cms[`reviews_testimonial_${n}_context`]?.trim() || t.context,
    rating: 5,
  })).filter((r) => r.quote.length > 0);
}
