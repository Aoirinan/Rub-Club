import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { ParisChiroPageContent } from "@/components/ParisChiroPageContent";
import { SsMarkdownBody } from "@/components/SsMarkdownBody";
import { LegacyPageBody } from "@/components/LegacyPageBody";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getParisOfficeHours } from "@/lib/office-hours";
import { getContentMany } from "@/lib/cms";
import { allParisChiroServiceSlugs, getParisChiroService } from "@/lib/paris-chiro-services";
import { getPublishedLegacyPage, listPublishedLegacyPagesForSite } from "@/lib/legacy-pages";
import { StretchFlexExercises } from "@/components/StretchFlexExercises";
import { getStretchFlexExercises } from "@/lib/stretch-flex";

const STRETCH_FLEX_SLUG = "stretch-and-flex-rehab";
import {
  parisChiroPageBodyId,
  parisChiroPageGalleryImageId,
  parisChiroPageHasImages,
  parisChiroPageHeroImageId,
  parisChiroPageImageIds,
  parisChiroPageMetaId,
} from "@/lib/paris-chiro-cms-registry";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

type ParisChiroPageContentData = {
  slug: string;
  title: string;
  metaDescription: string;
  body: string;
  heroImage?: string;
  galleryImages?: string[];
};

/** Static page copy with manager edits from the CMS (Paris chiro pages scope) applied. */
async function getParisChiroPageContent(slug: string): Promise<ParisChiroPageContentData | null> {
  const base = getParisChiroService(slug);
  if (!base) return null;
  const bodyId = parisChiroPageBodyId(slug);
  const metaId = parisChiroPageMetaId(slug);
  const imageIds = parisChiroPageImageIds(slug);
  const cms = await getContentMany([bodyId, metaId, ...imageIds]);
  const content: ParisChiroPageContentData = {
    slug,
    title: base.title,
    metaDescription: cms[metaId]?.trim() || base.metaDescription,
    body: cms[bodyId]?.trim() || base.body,
  };
  if (parisChiroPageHasImages(slug)) {
    content.heroImage = cms[parisChiroPageHeroImageId(slug)]?.trim();
    content.galleryImages = ([1, 2, 3] as const).map((n) =>
      cms[parisChiroPageGalleryImageId(slug, n)]?.trim() ?? "",
    );
  }
  return content;
}

export async function generateStaticParams() {
  const legacy = await listPublishedLegacyPagesForSite("chiro-paris");
  const slugs = new Set([
    ...allParisChiroServiceSlugs(),
    ...legacy.map((p) => p.slug),
  ]);
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getParisChiroPageContent(slug);
  if (page) {
    return buildPageMetadata({
      title: `${page.title} — Chiropractic Associates, Paris TX`,
      description: page.metaDescription,
      path: `/services/chiropractic/${page.slug}`,
      ogTitle: `${page.title} — Paris, TX`,
    });
  }
  const legacy = await getPublishedLegacyPage("chiro-paris", slug);
  if (legacy) {
    return buildPageMetadata({
      title: `${legacy.title} — Chiropractic Associates, Paris TX`,
      description: legacy.metaDescription,
      path: legacy.route,
      ogTitle: `${legacy.title} — Paris, TX`,
    });
  }
  return { title: "Chiropractic" };
}

export default async function ParisChiroServicePage({ params }: Props) {
  const { slug } = await params;
  const [page, parisHours, displayLocs] = await Promise.all([
    getParisChiroPageContent(slug),
    getParisOfficeHours(),
    getDisplayLocations(),
  ]);

  const paris = displayLocs.paris;
  const phone = paris.phonePrimary;

  // Curated page missing -> fall back to a verbatim legacy page (CURSOR_PROMPT §5).
  if (!page) {
    const legacy = await getPublishedLegacyPage("chiro-paris", slug);
    if (!legacy) notFound();
    return (
      <>
        <Breadcrumbs
          items={[
            { name: "Home", url: "/" },
            { name: "Chiropractic", url: "/services/chiropractic" },
            { name: legacy.title, url: legacy.route },
          ]}
        />
        <PageHero eyebrow="Chiropractic Associates · Paris, TX" title={legacy.title} />
        <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
          <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
            <LegacyPageBody blocks={legacy.blocks} heroImage={legacy.heroImage} images={legacy.images} />
          </section>
          <LocationHoursSection location={paris} hours={parisHours} />
          <ScheduleCtaCard
            title="Schedule an appointment"
            body="Contact our Paris office to discuss whether this treatment is right for you."
            secondary={{ label: `Call ${phone}`, href: telHref(phone) }}
          />
        </div>
      </>
    );
  }

  const hasImages = parisChiroPageHasImages(slug);
  // CURSOR_PROMPT §7: per-exercise photo galleries on the Stretch & Flex page.
  const stretchFlexExercises =
    slug === STRETCH_FLEX_SLUG ? await getStretchFlexExercises() : [];

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Chiropractic", url: "/services/chiropractic" },
          { name: page.title, url: `/services/chiropractic/${page.slug}` },
        ]}
      />
      <PageHero eyebrow="Chiropractic Associates · Paris, TX" title={page.title} />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            {hasImages ? (
              <ParisChiroPageContent body={page.body} heroImage={page.heroImage} />
            ) : (
              <SsMarkdownBody body={page.body} />
            )}
          </div>
        </section>
        {stretchFlexExercises.length ? (
          <StretchFlexExercises
            exercises={stretchFlexExercises}
            photos={page.galleryImages ?? []}
          />
        ) : null}
        <LocationHoursSection location={paris} hours={parisHours} />
        <ScheduleCtaCard
          title="Schedule an appointment"
          body="Contact our Paris office to discuss whether this treatment is right for you."
          secondary={{ label: `Call ${phone}`, href: telHref(phone) }}
        />
      </div>
    </>
  );
}
