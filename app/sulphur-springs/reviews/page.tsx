import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { TestimonialVideosSection } from "@/components/TestimonialVideosSection";
import { practiceThemeStyle } from "@/components/practice/theme";
import { getDisplayLocations, getReviewUrlForLocation } from "@/lib/cms-display";
import { getReviewsPageContent } from "@/lib/static-pages-content";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Patient Reviews — Sulphur Springs",
  description:
    "Hear what our patients say about Chiropractic Associates in Sulphur Springs, TX, then leave your own review on Google.",
  path: "/sulphur-springs/reviews",
  ogTitle: "Patient Reviews — Sulphur Springs",
  ogDescription: "Read patient stories and leave us a Google review.",
});

export default async function SulphurSpringsReviewsPage() {
  const displayLocs = await getDisplayLocations();
  const ss = displayLocs.sulphur_springs;
  const [content, reviewUrl] = await Promise.all([
    getReviewsPageContent("ss_"),
    getReviewUrlForLocation(ss.id),
  ]);

  return (
    <div style={practiceThemeStyle("sulphur-springs")}>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: "Reviews", url: "/sulphur-springs/reviews" },
        ]}
      />
      <PageHero
        eyebrow={content.heroEyebrow}
        title={content.heroTitle}
        lede={content.heroLede}
        variant="sulphur"
      />
      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
        <TestimonialVideosSection />
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.testimonials.map((t) => (
            <figure
              key={`${t.author}-${t.quote.slice(0, 24)}`}
              className="flex h-full flex-col justify-between border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md"
            >
              <blockquote className="text-base italic leading-relaxed text-stone-700">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 border-t border-stone-200 pt-3 text-sm">
                <span className="font-bold text-[var(--pp-heading)]">{t.author}</span>
                {t.context ? (
                  <span className="block text-stone-600">{t.context}</span>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </section>

        <section className="border-t-4 border-[var(--pp-accent)] bg-[var(--pp-heading)] p-6 text-white shadow-md sm:p-10">
          <h2 className="text-2xl font-black">{content.ctaHeading}</h2>
          <p className="mt-3 max-w-2xl text-white/90">{content.ctaBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring bg-[var(--pp-cta-hover)] px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-black/40"
            >
              Review {ss.shortName}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
