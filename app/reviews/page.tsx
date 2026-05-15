import type { Metadata } from "next";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { TestimonialVideosSection } from "@/components/TestimonialVideosSection";
import { TESTIMONIALS } from "@/lib/testimonials";
import { LOCATION_LIST, reviewUrlForLocation } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Patient Reviews",
  description:
    "Hear what Paris and Sulphur Springs patients say about Chiropractic Associates and The Rub Club, then leave your own review on Google.",
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: "Patient Reviews — The Rub Club & Chiropractic Associates",
    description: "Read patient stories and leave us a Google review.",
    url: "/reviews",
  },
};

export default function ReviewsPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Reviews", url: "/reviews" }]} />
      <PageHero
        eyebrow="Patient stories"
        title="What our patients say"
        lede="Voted Best Chiropractic Center and Best Massage in The Paris News reader polls. Below are paraphrased stories from real patient reviews."
      />
      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
        <TestimonialVideosSection />
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.quote}
              className="flex h-full flex-col justify-between border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md"
            >
              <blockquote className="text-base italic leading-relaxed text-stone-700">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 border-t border-stone-200 pt-3 text-sm">
                <span className="font-bold text-[#173f3b]">{t.author}</span>
                {t.context ? (
                  <span className="block text-stone-600">{t.context}</span>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-[#173f3b] p-6 text-white shadow-md sm:p-10">
          <h2 className="text-2xl font-black">Loved your visit? Leave us a review.</h2>
          <p className="mt-3 max-w-2xl text-white/90">
            A few words on Google help other families find dependable, family-owned care in Northeast
            Texas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {LOCATION_LIST.map((loc) => (
              <a
                key={loc.id}
                href={reviewUrlForLocation(loc.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring bg-[#f2d25d] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d]"
              >
                Review {loc.shortName}
              </a>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
