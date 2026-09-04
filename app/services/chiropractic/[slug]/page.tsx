import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildPageMetadata,
  descriptionFromBlocks,
  stripTrailingBrand,
} from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { ParisChiroPageContent } from "@/components/ParisChiroPageContent";
import { SsMarkdownBody } from "@/components/SsMarkdownBody";
import { LegacyPageBody } from "@/components/LegacyPageBody";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getParisChiroOfficeHours } from "@/lib/office-hours";
import { getContentMany } from "@/lib/cms";
import { allParisChiroServiceSlugs, getParisChiroService } from "@/lib/paris-chiro-services";
import { getPublishedLegacyPage, listPublishedLegacyPagesForSite } from "@/lib/legacy-pages";
import { StretchFlexExercises } from "@/components/StretchFlexExercises";
import { getStretchFlexExercises } from "@/lib/stretch-flex";
import { parisText } from "@/lib/paris-pages-cms";
import { getUiText } from "@/lib/ui-text";

const STRETCH_FLEX_SLUG = "stretch-and-flex-rehab";
import {
  parisChiroPageBodyId,
  parisChiroPageGalleryImageId,
  parisChiroPageHasImages,
  parisChiroPageHeroImageId,
  parisChiroPageImageIds,
  parisChiroPageMetaId,
  parisChiroPageTitleId,
} from "@/lib/paris-chiro-cms-registry";

/** Copy shared by every Paris service page (eyebrow, title suffixes, CTA). */
const SHARED_COPY_IDS = [
  "paris_chiro_pages_eyebrow",
  "paris_chiro_pages_title_suffix",
  "paris_chiro_pages_og_suffix",
  "paris_chiro_pages_cta_body",
  "paris_chiro_stretch_flex_exercises_heading",
  "paris_chiro_stretch_flex_image_alt",
] as const;

async function getSharedCopy() {
  const c = await getContentMany([...SHARED_COPY_IDS]);
  return (id: (typeof SHARED_COPY_IDS)[number]) => parisText(c, id);
}

/**
 * Massage topics that the old site published under /services/chiropractic/ and
 * that also live at /services/massage/. Both keep rendering (old inbound links
 * still land), but search engines are pointed at the massage copy.
 */
const MASSAGE_TOPIC_CANONICAL: Record<string, string> = Object.fromEntries(
  [
    "swedish-massage",
    "thai-massage",
    "hot-stone-massage",
    "deep-tissue-massage",
    "prenatal-massage",
    "sports-massage",
  ].map((slug) => [slug, `/services/massage/${slug}`]),
);

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
  const titleId = parisChiroPageTitleId(slug);
  const imageIds = parisChiroPageImageIds(slug);
  const cms = await getContentMany([bodyId, metaId, titleId, ...imageIds]);
  const content: ParisChiroPageContentData = {
    slug,
    title: cms[titleId]?.trim() || base.title,
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
  const slugs = new Set(allParisChiroServiceSlugs());
  try {
    const legacy = await listPublishedLegacyPagesForSite("chiro-paris");
    for (const p of legacy) slugs.add(p.slug);
  } catch {
    // Firestore unavailable at build — static slugs still ship; legacy pages render on demand.
  }
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [page, shared] = await Promise.all([getParisChiroPageContent(slug), getSharedCopy()]);
  if (page) {
    return buildPageMetadata({
      title: `${page.title}${shared("paris_chiro_pages_title_suffix")}`,
      description: page.metaDescription,
      path: `/services/chiropractic/${page.slug}`,
      ogTitle: `${page.title}${shared("paris_chiro_pages_og_suffix")}`,
    });
  }
  const legacy = await getPublishedLegacyPage("chiro-paris", slug);
  if (legacy) {
    // Imported titles often already end with the brand ("… | Chiropractic
    // Associates"); strip it so the tab doesn't repeat it twice more.
    const legacyTitle = stripTrailingBrand(legacy.title);
    return buildPageMetadata({
      title: `${legacyTitle}${shared("paris_chiro_pages_title_suffix")}`,
      brandInTitle: true,
      description: legacy.metaDescription.trim() || descriptionFromBlocks(legacy.blocks),
      path: legacy.route,
      canonical: MASSAGE_TOPIC_CANONICAL[slug],
      ogTitle: `${legacyTitle}${shared("paris_chiro_pages_og_suffix")}`,
    });
  }
  return { title: "Chiropractic" };
}

export default async function ParisChiroServicePage({ params }: Props) {
  const { slug } = await params;
  const [page, parisHours, displayLocs, shared, ui] = await Promise.all([
    getParisChiroPageContent(slug),
    getParisChiroOfficeHours(),
    getDisplayLocations(),
    getSharedCopy(),
    getUiText(),
  ]);

  const paris = displayLocs.paris;
  const phone = paris.phonePrimary;
  const eyebrow = shared("paris_chiro_pages_eyebrow");
  const cta = {
    title: ui.ui_schedule_appointment_cta,
    body: shared("paris_chiro_pages_cta_body"),
    secondary: { label: `${ui.ui_call_prefix} ${phone}`, href: telHref(phone) },
  };

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
        <PageHero eyebrow={eyebrow} title={legacy.title} />
        <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
          <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
            <LegacyPageBody blocks={legacy.blocks} heroImage={legacy.heroImage} images={legacy.images} />
          </section>
          <LocationHoursSection location={paris} hours={parisHours} />
          <ScheduleCtaCard title={cta.title} body={cta.body} secondary={cta.secondary} />
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
      <PageHero eyebrow={eyebrow} title={page.title} />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            {hasImages ? (
              <ParisChiroPageContent
                body={page.body}
                heroImage={page.heroImage}
                imageAlt={shared("paris_chiro_stretch_flex_image_alt")}
              />
            ) : (
              <SsMarkdownBody body={page.body} />
            )}
          </div>
        </section>
        {stretchFlexExercises.length ? (
          <StretchFlexExercises
            exercises={stretchFlexExercises}
            photos={page.galleryImages ?? []}
            heading={shared("paris_chiro_stretch_flex_exercises_heading")}
            photoAlt={shared("paris_chiro_stretch_flex_image_alt")}
          />
        ) : null}
        <LocationHoursSection location={paris} hours={parisHours} />
        <ScheduleCtaCard title={cta.title} body={cta.body} secondary={cta.secondary} />
      </div>
    </>
  );
}
