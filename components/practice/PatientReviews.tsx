import Link from "next/link";
import { SectionHeading } from "@/components/practice/SectionHeading";
import type {
  PracticeReviewsSection,
  PracticeTestimonial,
} from "@/lib/practice-pages-shared";

/** Patient review cards (horizontal snap scroll on mobile, grid on desktop). */
export function PatientReviews({
  data,
  testimonials,
}: {
  data: PracticeReviewsSection;
  testimonials: PracticeTestimonial[];
}) {
  if (!data.published) return null;
  const rows = testimonials.filter((t) => t.published && t.quote.trim().length > 0);
  if (rows.length === 0) return null;

  return (
    <section className="px-4 py-12 sm:px-8">
      {data.heading.trim() ? <SectionHeading>{data.heading}</SectionHeading> : null}
      <div className="mx-auto mt-10 flex max-w-6xl snap-x snap-mandatory gap-6 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible">
        {rows.map((t) => (
          <blockquote
            key={t.id}
            className="flex w-[85%] shrink-0 snap-center flex-col rounded-xl bg-white p-7 text-center shadow-md sm:w-[60%] lg:w-auto"
          >
            {t.name.trim() ? (
              <p className="text-xl font-semibold text-stone-700">{t.name}</p>
            ) : null}
            {t.context.trim() ? (
              <p className="mt-1 text-xs text-stone-400">{t.context}</p>
            ) : null}
            <span aria-hidden className="mt-4 text-5xl font-black leading-none text-[var(--pp-accent)]">
              &ldquo;
            </span>
            <p className="mt-2 flex-1 text-sm font-bold leading-relaxed text-[var(--pp-accent)]">
              {t.quote}
            </p>
          </blockquote>
        ))}
      </div>
      {data.linkToReviewsPage && data.reviewsUrl.trim() ? (
        <p className="mt-8 text-center">
          <Link
            href={data.reviewsUrl}
            className="focus-ring text-sm font-black uppercase tracking-wide text-[var(--pp-accent)] underline hover:text-[var(--pp-accent-hover)]"
          >
            {data.reviewsLinkLabel.trim() || "Read more reviews"}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
