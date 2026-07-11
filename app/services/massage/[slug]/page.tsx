import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { LegacyPageBody } from "@/components/LegacyPageBody";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getParisOfficeHours } from "@/lib/office-hours";
import {
  getPublishedLegacyPage,
  listPublishedLegacyPagesForSite,
  LEGACY_SITE_LABEL,
} from "@/lib/legacy-pages";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const pages = await listPublishedLegacyPagesForSite("massage-paris");
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedLegacyPage("massage-paris", slug);
  if (!page) return { title: "Massage" };
  return buildPageMetadata({
    title: `${page.title} — The Rub Club, Paris TX`,
    description: page.metaDescription,
    path: page.route,
    ogTitle: `${page.title} — Paris, TX`,
  });
}

export default async function MassageLegacyPage({ params }: Props) {
  const { slug } = await params;
  const [page, parisHours, displayLocs] = await Promise.all([
    getPublishedLegacyPage("massage-paris", slug),
    getParisOfficeHours(),
    getDisplayLocations(),
  ]);
  if (!page) notFound();

  const label = LEGACY_SITE_LABEL["massage-paris"];
  const paris = displayLocs.paris;
  const phone = paris.phonePrimary;

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: label.section, url: label.sectionUrl },
          { name: page.title, url: page.route },
        ]}
      />
      <PageHero eyebrow={label.eyebrow} title={page.title} />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <LegacyPageBody blocks={page.blocks} heroImage={page.heroImage} images={page.images} />
        </section>
        <LocationHoursSection location={paris} hours={parisHours} />
        <ScheduleCtaCard
          title="Book a massage"
          body="Contact The Rub Club in Paris to schedule your session."
          secondary={{ label: `Call ${phone}`, href: telHref(phone) }}
        />
      </div>
    </>
  );
}
