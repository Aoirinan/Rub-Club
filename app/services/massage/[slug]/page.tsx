import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { LegacyPageBody } from "@/components/LegacyPageBody";
import { telHref } from "@/lib/constants";
import { getContentMany } from "@/lib/cms";
import { getDisplayLocations } from "@/lib/cms-display";
import { getParisOfficeHours } from "@/lib/office-hours";
import { getUiText } from "@/lib/ui-text";
import { MASSAGE_PAGE_TEXT_IDS, resolveMassagePageText } from "@/lib/massage-page-cms";
import {
  getPublishedLegacyPage,
  listPublishedLegacyPagesForSite,
  LEGACY_SITE_LABEL,
} from "@/lib/legacy-pages";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const pages = await listPublishedLegacyPagesForSite("massage-paris");
    return pages.map((p) => ({ slug: p.slug }));
  } catch {
    // Firestore unavailable at build — pages render on demand instead of failing the build.
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [page, cms] = await Promise.all([
    getPublishedLegacyPage("massage-paris", slug),
    getContentMany([...MASSAGE_PAGE_TEXT_IDS]),
  ]);
  const text = resolveMassagePageText(cms);
  if (!page) return { title: text.massage_subpage_breadcrumb };
  // A meta title saved in Legacy pages wins; otherwise title + editable suffix.
  const customMeta = page.metaTitle.trim();
  const title =
    customMeta && customMeta !== page.title
      ? customMeta
      : `${page.title}${text.massage_subpage_title_suffix}`;
  return buildPageMetadata({
    title,
    description: page.metaDescription,
    path: page.route,
    ogTitle: `${page.title}${text.massage_subpage_og_suffix}`,
  });
}

export default async function MassageLegacyPage({ params }: Props) {
  const { slug } = await params;
  const [page, parisHours, displayLocs, cms, ui] = await Promise.all([
    getPublishedLegacyPage("massage-paris", slug),
    getParisOfficeHours(),
    getDisplayLocations(),
    getContentMany([...MASSAGE_PAGE_TEXT_IDS]),
    getUiText(),
  ]);
  if (!page) notFound();

  const text = resolveMassagePageText(cms);
  const label = LEGACY_SITE_LABEL["massage-paris"];
  const paris = displayLocs.paris;
  const phone = paris.phonePrimary;

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: text.massage_subpage_breadcrumb, url: label.sectionUrl },
          { name: page.title, url: page.route },
        ]}
      />
      <PageHero eyebrow={text.massage_subpage_eyebrow} title={page.title} />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <LegacyPageBody
            blocks={page.blocks}
            bodyMarkdown={page.bodyMarkdown}
            heroImage={page.heroImage}
            images={page.images}
          />
        </section>
        <LocationHoursSection location={paris} hours={parisHours} />
        <ScheduleCtaCard
          title={text.massage_subpage_cta_title}
          body={text.massage_subpage_cta_body}
          secondary={{ label: `${ui.ui_call_prefix} ${phone}`, href: telHref(phone) }}
        />
      </div>
    </>
  );
}
