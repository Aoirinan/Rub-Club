import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { TestimonialVideosSection } from "@/components/TestimonialVideosSection";
import { practiceThemeStyle } from "@/components/practice/theme";
import { getPageBrand } from "@/lib/page-business-theme";
import { getDisplayLocations, getReviewUrlForLocation } from "@/lib/cms-display";
import { getReviewsPageContent } from "@/lib/static-pages-content";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Patient Reviews",
  description:
    "Hear what Paris and Sulphur Springs patients say about Chiropractic Associates and The Rub Club, then leave your own review on Google.",
  path: "/reviews",
  ogTitle: "Patient Reviews — Chiropractic Associates",
  ogDescription: "Read patient stories and leave us a Google review.",
});

export default async function ReviewsPage() {
  const displayLocs = await getDisplayLocations();
  const locationList = [displayLocs.paris, displayLocs.sulphur_springs];
  const [content, reviewLinks, brand] = await Promise.all([
    getReviewsPageContent(),
    Promise.all(
      locationList.map(async (loc) => ({
        id: loc.id,
        shortName: loc.shortName,
        url: await getReviewUrlForLocation(loc.id),
      })),
    ),
    getPageBrand(),
  ]);

  return (
    <div style={practiceThemeStyle(brand.loc)}>
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "Reviews", url: "/reviews" }]} />
      <PageHero
        eyebrow={content.heroEyebrow}
        title={content.heroTitle}
        lede={content.heroLede}
        variant={brand.variant}
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
            {reviewLinks.map((loc) => (
              <a
                key={loc.id}
                href={loc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring bg-[var(--pp-cta-hover)] px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-black/40"
              >
                Review {loc.shortName}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
