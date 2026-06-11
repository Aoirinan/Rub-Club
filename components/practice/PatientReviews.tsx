import Link from "next/link";
import type {
  PracticeReviewsSection,
  PracticeTestimonial,
} from "@/lib/practice-pages-shared";

function initialFor(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "★";
}

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
    <section className="bg-[#f8f8f6] px-4 py-12 sm:px-8">
      {data.heading.trim() ? (
        <h2 className="text-center text-2xl font-black text-[var(--pp-heading)]">
          {data.heading}
        </h2>
      ) : null}
      <div className="mx-auto mt-10 flex max-w-6xl snap-x snap-mandatory gap-6 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible">
        {rows.map((t) => (
          <blockquote
            key={t.id}
            className="flex w-[85%] shrink-0 snap-center flex-col border-b-4 border-[var(--pp-accent)] bg-white p-6 shadow-sm sm:w-[60%] lg:w-auto"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pp-accent)] text-lg font-black text-white"
              >
                {initialFor(t.name)}
              </span>
              {t.name.trim() || t.context.trim() ? (
                <div className="min-w-0">
                  {t.name.trim() ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      {t.name}
                    </p>
                  ) : null}
                  {t.context.trim() ? (
                    <p className="text-xs text-stone-400">{t.context}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <p className="mt-4 flex-1 text-stone-700">&ldquo;{t.quote}&rdquo;</p>
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
