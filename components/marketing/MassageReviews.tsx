import type { MassageReview } from "@/lib/massage-reviews";

/** Five stars, `filled` of them solid (CURSOR_PROMPT §6b). */
function StarRating({ filled, outOf = 5 }: { filled: number; outOf?: number }) {
  const stars = Array.from({ length: outOf }, (_, i) => i < filled);
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${filled} out of ${outOf} stars`}>
      {stars.map((on, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-4 w-4 ${on ? "text-[#f19f1f]" : "text-stone-300"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 15.27l4.15 2.51-1.1-4.72 3.66-3.17-4.83-.41L10 5.1 8.12 9.49l-4.83.41 3.66 3.17-1.1 4.72z" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** Massage page reviews section: 5-star display, name, date, review text. */
export function MassageReviews({ reviews }: { reviews: MassageReview[] }) {
  if (!reviews.length) return null;
  return (
    <section
      aria-labelledby="massage-reviews"
      className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10"
    >
      <h2 id="massage-reviews" className="text-2xl font-black text-[#4a1515]">
        What clients say
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => {
          const date = formatDate(r.date);
          return (
            <figure key={i} className="flex flex-col border border-stone-200 bg-stone-50 p-5 shadow-sm">
              <StarRating filled={Math.round(r.rating)} />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-stone-700">
                “{r.quote}”
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-black text-[#4a1515]">{r.name}</span>
                {r.context ? <span className="block text-xs text-stone-500">{r.context}</span> : null}
                {date ? <span className="block text-xs text-stone-400">{date}</span> : null}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
